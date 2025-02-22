use cosmwasm_std::{
    entry_point, from_json, to_json_binary, Addr, BankMsg, Coin, CosmosMsg, DepsMut, Env,
    IbcBasicResponse, IbcChannel, IbcChannelCloseMsg, IbcChannelConnectMsg, IbcChannelOpenMsg,
    IbcChannelOpenResponse, IbcOrder, IbcPacketAckMsg, IbcPacketReceiveMsg, IbcPacketTimeoutMsg,
    IbcReceiveResponse, Never, StdAck, StdError, StdResult, Uint128, WasmMsg,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::msg::IbcExecuteMsg;
use crate::state::{FillIntent, IntentStatus, IntentType, EXECUTOR_ESCROW, INTENTS, USER_ESCROW};
use crate::ContractError;

pub const IBC_VERSION: &str = "beep-0.1.0";

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum IbcAcknowledgement {
    Success(String), // Intent ID
    Error(String),   // Error message
}

/// Handles the `OpenInit` and `OpenTry` parts of the IBC handshake.
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_channel_open(
    _deps: DepsMut,
    _env: Env,
    msg: IbcChannelOpenMsg,
) -> Result<IbcChannelOpenResponse, ContractError> {
    validate_order_and_version(msg.channel(), msg.counterparty_version())?;
    Ok(None)
}

pub fn validate_order_and_version(
    channel: &IbcChannel,
    counterparty_version: Option<&str>,
) -> Result<(), ContractError> {
    // We expect an unordered channel here. Ordered channels have the
    // property that if a message is lost the entire channel will stop
    // working until you start it again.
    if channel.order != IbcOrder::Unordered {
        return Err(ContractError::Std(StdError::generic_err(
            "Only supports unordered channels",
        )));
    }

    if channel.version != IBC_VERSION {
        return Err(ContractError::Std(StdError::generic_err(format!(
            "Invalid IBC version. Actual: {}, Expected: {}",
            channel.version.to_string(),
            IBC_VERSION.to_string(),
        ))));
    }

    // Make sure that we're talking with a counterparty who speaks the
    // same "protocol" as us.
    //
    // For a connection between chain A and chain B being established
    // by chain A, chain B knows counterparty information during
    // `OpenTry` and chain A knows counterparty information during
    // `OpenAck`. We verify it when we have it but when we don't it's
    // alright.
    if let Some(counterparty_version) = counterparty_version {
        if counterparty_version != IBC_VERSION {
            return Err(ContractError::Std(StdError::generic_err(format!(
                "Invalid IBC version. Actual: {}, Expected: {}",
                counterparty_version.to_string(),
                IBC_VERSION.to_string(),
            ))));
        }
    }

    Ok(())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_channel_connect(
    _deps: DepsMut,
    _env: Env,
    msg: IbcChannelConnectMsg,
) -> Result<IbcBasicResponse, ContractError> {
    validate_order_and_version(msg.channel(), msg.counterparty_version())?;

    let channel = msg.channel().endpoint.channel_id.clone();

    Ok(IbcBasicResponse::new()
        .add_attribute("action", "ibc_channel_connect")
        .add_attribute("channel_id", channel))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_channel_close(
    _deps: DepsMut,
    _env: Env,
    msg: IbcChannelCloseMsg,
) -> Result<IbcBasicResponse, ContractError> {
    let channel = msg.channel().endpoint.channel_id.clone();

    Ok(IbcBasicResponse::new()
        .add_attribute("action", "ibc_channel_close")
        .add_attribute("channel", channel))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_packet_receive(
    deps: DepsMut,
    env: Env,
    msg: IbcPacketReceiveMsg,
) -> Result<IbcReceiveResponse, Never> {
    // Regardless of if our processing of this packet works we need to
    // commit an ACK to the chain. As such, we wrap all handling logic
    // in a seprate function and on error write out an error ack.
    match process_received_intent(deps, env, msg) {
        Ok(response) => Ok(response),
        Err(error) => Ok(
            IbcReceiveResponse::new(StdAck::error(format!("{:?}", error)))
                .add_attribute("action", "ibc_packet_receive")
                .add_attribute("error", error.to_string()),
        ),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_packet_ack(
    deps: DepsMut,
    _env: Env,
    ack: IbcPacketAckMsg,
) -> Result<IbcBasicResponse, ContractError> {
    let ack: IbcAcknowledgement = from_json(&ack.acknowledgement.data)?;
    let mut messages: Vec<CosmosMsg> = vec![];

    match ack {
        IbcAcknowledgement::Success(intent_id) => {
            // Update intent status to completed
            let mut intent = INTENTS.load(deps.storage, &intent_id)?;
            intent.status = IntentStatus::Completed;
            INTENTS.save(deps.storage, &intent_id, &intent)?;

            // send funds to user
            match intent.clone().intent_type {
                IntentType::Swap { output_tokens } => {
                    for token in output_tokens {
                        let mut to = intent.clone().creator;
                        if token.target_address.is_some() {
                            to = token.target_address.unwrap()
                        }

                        if token.is_native {
                            messages.push(add_native_transfer_msg(
                                &token.token,
                                &to,
                                token.amount,
                            )?);
                        } else {
                            messages.push(add_cw20_transfer_msg(&token.token, &to, token.amount)?);
                        }
                    }

                    // Delete escrow
                    EXECUTOR_ESCROW.remove(deps.storage, (&intent.executor.unwrap(), &intent.id));
                }
                _ => return Err(ContractError::Unimplemented {}),
            }

            Ok(IbcBasicResponse::new()
                .add_attribute("action", "acknowledge")
                .add_attribute("success", "true")
                .add_attribute("intent_id", intent_id))
        }
        IbcAcknowledgement::Error(err) => {
            // Handle error acknowledgement
            Ok(IbcBasicResponse::new()
                .add_attribute("action", "ibc_packet_ack")
                .add_attribute("success", "false")
                .add_attribute("error", err))
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc_packet_timeout(
    deps: DepsMut,
    _env: Env,
    msg: IbcPacketTimeoutMsg,
) -> Result<IbcBasicResponse, ContractError> {
    let filler: FillIntent = from_json(msg.packet.data)?;
    let mut messages: Vec<CosmosMsg> = vec![];

    // return funds to executor
    let tokens = EXECUTOR_ESCROW.load(deps.storage, (&filler.executor, &filler.intent_id))?;

    for token in tokens {
        if token.is_native {
            messages.push(add_native_transfer_msg(
                &token.token,
                &filler.executor,
                token.amount,
            )?);
        } else {
            messages.push(add_cw20_transfer_msg(
                &token.token,
                &filler.executor,
                token.amount,
            )?);
        }
    }

    // As with ack above, nothing to do here. If we cared about
    // keeping track of state between the two chains then we'd want to
    // respond to this likely as it means that the packet in question
    // isn't going anywhere.
    Ok(IbcBasicResponse::new()
        .add_messages(messages)
        .add_attribute("action", "ibc_packet_timeout"))
}

pub fn process_received_intent(
    deps: DepsMut,
    _env: Env,
    msg: IbcPacketReceiveMsg,
) -> Result<IbcReceiveResponse, ContractError> {
    // The channel this packet is being relayed along on this chain.
    let channel = msg.packet.dest.channel_id;
    let msg: IbcExecuteMsg = from_json(&msg.packet.data)?;

    match msg {
        IbcExecuteMsg::FillIntent {
            intent_id,
            executor,
        } => execute_ibc_fill_intent(deps, channel, intent_id, executor),
    }
}

fn execute_ibc_fill_intent(
    deps: DepsMut,
    _channel: String,
    intent_id: String,
    executor: Addr,
) -> Result<IbcReceiveResponse, ContractError> {
    let intent = INTENTS.load(deps.storage, &intent_id);
    let mut messages: Vec<CosmosMsg> = vec![];

    match intent {
        Ok(mut intent) => {
            // transfer input tokens to executor
            for token in intent.clone().input_tokens {
                if token.is_native {
                    // transfer native token
                    messages.push(add_native_transfer_msg(
                        &token.token,
                        &executor,
                        token.amount,
                    )?);
                } else {
                    // transfer cw20 token
                    messages.push(add_cw20_transfer_msg(
                        &token.token,
                        &executor,
                        token.amount,
                    )?);
                }
            }

            // Assign executor
            intent.executor = Some(executor);
            INTENTS.save(deps.storage, &intent_id, &intent)?;

            // Delete escrow
            USER_ESCROW.remove(deps.storage, (&intent.clone().creator, &intent.id));

            let ack_data = to_json_binary(&intent_id)?;
            Ok(IbcReceiveResponse::new(StdAck::success(ack_data))
                .add_attribute("action", "execute_ibc_fill_intent"))
        }

        Err(error) => Ok(
            IbcReceiveResponse::new(StdAck::error(format!("{:?}", error)))
                .add_attribute("action", "execute_ibc_fill_intent")
                .add_messages(messages),
        ),
    }
}

pub fn add_cw20_transfer_msg(
    token_address: &str,
    to: &Addr,
    amount: Uint128,
) -> StdResult<CosmosMsg> {
    Ok(WasmMsg::Execute {
        contract_addr: token_address.to_string(),
        msg: to_json_binary(&cw20::Cw20ExecuteMsg::Transfer {
            recipient: to.to_string(),
            amount,
        })?,
        funds: vec![],
    }
    .into())
}

// Helper function to handle native token transfers
pub fn add_native_transfer_msg(denom: &str, to: &Addr, amount: Uint128) -> StdResult<CosmosMsg> {
    Ok(BankMsg::Send {
        to_address: to.to_string(),
        amount: vec![Coin {
            denom: denom.to_string(),
            amount,
        }],
    }
    .into())
}
