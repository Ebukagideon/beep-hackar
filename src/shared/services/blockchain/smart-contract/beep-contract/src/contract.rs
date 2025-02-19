#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;
use execute::{
    execute_add_supported_protocols, execute_add_supported_tokens, execute_create_intent,
    execute_fill_intent, execute_remove_supported_protocols, execute_remove_supported_tokens,
    execute_update_admin, execute_update_default_timeout_height, execute_withdraw_intent_fund,
};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Config, CONFIG};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:beep-contract";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        admin: info.sender.clone(),
        supported_tokens: msg.supported_tokens,
        default_timeout_height: msg.default_timeout_height,
        supported_protocols: msg.supported_protocols,
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", info.sender.to_string())
        .add_attribute(
            "default_timeout_height",
            msg.default_timeout_height.to_string(),
        ))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateIntent {
            intent_type,
            input_tokens,
            target_chain_id,
            timeout,
            tip,
        } => execute_create_intent(
            deps,
            env,
            info,
            intent_type,
            input_tokens,
            target_chain_id,
            timeout,
            tip,
        ),
        ExecuteMsg::FillIntent {
            intent_id,
            source_chain_id,
            intent_type,
        } => execute_fill_intent(deps, env, info, intent_id, source_chain_id, intent_type),
        ExecuteMsg::WithdrawIntentFund { intent_id } => {
            execute_withdraw_intent_fund(deps, env, info, intent_id)
        }
        ExecuteMsg::UpdateAdmin { new_admin } => execute_update_admin(deps, info, new_admin),
        ExecuteMsg::AddSupportedTokens { tokens } => {
            execute_add_supported_tokens(deps, info, tokens)
        }
        ExecuteMsg::RemoveSupportedTokens { tokens } => {
            execute_remove_supported_tokens(deps, info, tokens)
        }
        ExecuteMsg::AddSupportedProtocols { protocols } => {
            execute_add_supported_protocols(deps, info, protocols)
        }
        ExecuteMsg::RemoveSupportedProtocols { protocols } => {
            execute_remove_supported_protocols(deps, info, protocols)
        }
        ExecuteMsg::UpdateDefaultTimeoutHeight {
            default_timeout_height,
        } => execute_update_default_timeout_height(deps, info, default_timeout_height),
    }
}

pub mod execute {
    use cosmwasm_std::{Addr, CosmosMsg, IbcMsg, IbcTimeout, StdError, Uint128, WasmMsg};
    use sha2::{Digest, Sha256};

    use crate::{
        ibc::{add_cw20_transfer_msg, add_native_transfer_msg},
        msg::IbcExecuteMsg,
        state::{
            BeepCoin, Intent, IntentStatus, IntentType, ESCROW, IBC_CONNECTIONS, INTENTS,
            USER_NONCE,
        },
    };

    use super::*;

    pub fn execute_create_intent(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        intent_type: IntentType,
        input_tokens: Vec<BeepCoin>,
        target_chain_id: String,
        timeout: Option<u64>,
        tip: BeepCoin,
    ) -> Result<Response, ContractError> {
        // Validate parameters
        let config = CONFIG.load(deps.storage)?;
        let nonce = USER_NONCE
            .load(deps.storage, &info.sender.clone())
            .unwrap_or(0);

        let id = generate_intent_id(info.sender.clone(), nonce);

        // Validate intent type and associated parameters
        validate_intent_type(&intent_type, &config)?;

        // Validate all input tokens are supported
        let validate_msg = validate_tokens(&deps, &env, &info, &input_tokens)?;

        // Validate tip
        let tip_msg = validate_tokens(&deps, &env, &info, &[tip.clone()])?;

        // transfer tokens to contract
        let msgs = [validate_msg, tip_msg].concat();

        // Create and save intent
        let intent = Intent {
            id: id.clone().to_owned(),
            creator: info.sender.clone(),
            input_tokens: input_tokens.clone(),
            intent_type,
            executor: None,
            status: IntentStatus::Active,
            created_at: env.block.height,
            origin_chain_id: env.block.chain_id,
            target_chain_id,
            timeout: timeout.unwrap_or(env.block.height + config.default_timeout_height),
            tip,
        };
        INTENTS.save(deps.storage, &id, &intent)?;

        // Escrow tokens
        ESCROW.save(deps.storage, (&info.sender, &id), &input_tokens)?;

        // Update nonce
        USER_NONCE.save(deps.storage, &info.sender, &(nonce + 1))?;

        Ok(Response::new()
            .add_messages(msgs)
            .add_attribute("method", "create_intent")
            .add_attribute("intent_id", id)
            .add_attribute("status", "active"))
    }

    pub fn execute_fill_intent(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        intent_id: String,
        source_chain_id: String,
        intent_type: IntentType,
    ) -> Result<Response, ContractError> {
        // Validate tokens were attached
        let (tokens, msgs) = validate_filling(&deps, &env, &info, &intent_id, &intent_type)?;

        // Escrow tokens
        ESCROW.save(deps.storage, (&info.sender, &intent_id), &tokens)?;

        // Create IBC packet
        let timeout = IbcTimeout::with_timestamp(env.block.time.plus_minutes(2));
        let connection = IBC_CONNECTIONS.load(deps.storage, &source_chain_id)?;
        let ibc_msg = IbcMsg::SendPacket {
            channel_id: connection.channel_id,
            data: to_json_binary(&IbcExecuteMsg::FillIntent {
                intent_id: intent_id.clone(),
                executor: info.sender.clone(),
            })?,
            timeout,
        };

        Ok(Response::new()
            .add_messages(msgs)
            .add_message(ibc_msg)
            .add_attribute("method", "fill_intent")
            .add_attribute("intent_id", intent_id)
            .add_attribute("executor", info.sender))
    }

    pub fn execute_withdraw_intent_fund(
        deps: DepsMut,
        env: Env,
        info: MessageInfo,
        intent_id: String,
    ) -> Result<Response, ContractError> {
        // check if intent
        let mut intent = INTENTS.load(deps.storage, &intent_id)?;

        if env.block.height < intent.timeout {
            return Err(ContractError::Std(StdError::generic_err(
                "Intent has not expired",
            )));
        }

        if intent.creator != info.sender {
            return Err(ContractError::Unauthorized {});
        }

        // update intent
        intent.status = IntentStatus::Expired;
        INTENTS.save(deps.storage, &intent_id, &intent)?;

        let tokens = ESCROW.load(deps.storage, (&info.sender, &intent_id))?;
        let mut messages: Vec<CosmosMsg> = vec![];

        for token in tokens {
            if token.is_native {
                messages.push(add_native_transfer_msg(
                    &token.token,
                    &info.sender,
                    token.amount,
                )?);
            } else {
                messages.push(add_cw20_transfer_msg(
                    &token.token,
                    &info.sender,
                    token.amount,
                )?);
            }
        }

        // remove funds from escrow
        ESCROW.remove(deps.storage, (&info.sender, &intent_id));

        Ok(Response::new()
            .add_messages(messages)
            .add_attribute("action", "withdraw_intent_fund"))
    }

    pub fn execute_update_admin(
        deps: DepsMut,
        info: MessageInfo,
        new_admin: Addr,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        config.admin = new_admin.clone();
        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_update_admin")
            .add_attribute("old_admin", info.sender.to_string())
            .add_attribute("new_admin", new_admin.to_string()))
    }

    pub fn execute_add_supported_tokens(
        deps: DepsMut,
        info: MessageInfo,
        tokens: Vec<String>,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        for token in tokens {
            if !config.supported_tokens.contains(&token) {
                config.supported_tokens.push(token);
            }
        }

        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_add_supported_tokens")
            .add_attribute("status", "success"))
    }

    pub fn execute_remove_supported_tokens(
        deps: DepsMut,
        info: MessageInfo,
        tokens: Vec<String>,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        config
            .supported_tokens
            .retain(|token| !tokens.contains(token));

        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_remove_supported_tokens")
            .add_attribute("status", "success"))
    }

    pub fn execute_add_supported_protocols(
        deps: DepsMut,
        info: MessageInfo,
        protocols: Vec<String>,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        for protocol in protocols {
            if !config.supported_protocols.contains(&protocol) {
                config.supported_protocols.push(protocol);
            }
        }

        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_add_supported_protocols")
            .add_attribute("status", "success"))
    }

    pub fn execute_remove_supported_protocols(
        deps: DepsMut,
        info: MessageInfo,
        protocols: Vec<String>,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        config
            .supported_protocols
            .retain(|protocol| !protocols.contains(protocol));

        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_remove_supported_protocols")
            .add_attribute("status", "success"))
    }

    pub fn execute_update_default_timeout_height(
        deps: DepsMut,
        info: MessageInfo,
        default_timeout_height: u64,
    ) -> Result<Response, ContractError> {
        let mut config = CONFIG.load(deps.storage)?;

        if info.sender != config.admin {
            return Err(ContractError::Unauthorized {});
        }

        config.default_timeout_height = default_timeout_height;
        CONFIG.save(deps.storage, &config)?;

        Ok(Response::new()
            .add_attribute("method", "execute_update_default_timeout_height")
            .add_attribute("status", "success"))
    }

    fn generate_intent_id(creator: Addr, nonce: u128) -> String {
        let mut hasher = Sha256::new();

        // Combine multiple factors for better uniqueness
        let input = format!("{}:{}", creator, nonce);

        hasher.update(input.as_bytes());
        let result = hasher.finalize();

        format!("intent{}", hex::encode(&result[..20]))
    }

    fn validate_tokens(
        deps: &DepsMut,
        env: &Env,
        info: &MessageInfo,
        input_tokens: &[BeepCoin],
    ) -> Result<Vec<CosmosMsg>, ContractError> {
        let config = CONFIG.load(deps.storage)?;
        let mut msg: Vec<CosmosMsg> = vec![];
        for token in input_tokens {
            if !config.supported_tokens.contains(&token.token) {
                return Err(ContractError::UnsupportedToken {});
            }

            if token.is_native {
                validate_native_token_payment(info, &token.token, token.amount)?;
            } else {
                let transfer_from_msg = validate_cw20_token_payment(
                    &deps.as_ref(),
                    env,
                    info,
                    &token.token,
                    token.amount,
                )?;
                msg = [msg.clone(), transfer_from_msg].concat();
            }
        }

        Ok(msg)
    }

    fn validate_native_token_payment(
        info: &MessageInfo,
        denom: &str,
        required_amount: Uint128,
    ) -> StdResult<()> {
        // Find the coin with matching denom in the sent funds
        let sent_amount = info
            .funds
            .iter()
            .find(|coin| coin.denom == denom)
            .map(|coin| coin.amount)
            .unwrap_or_default();

        // Check if sent amount matches required amount
        if sent_amount < required_amount {
            return Err(StdError::generic_err(format!(
                "Insufficient native token sent. Required: {}, Sent: {}",
                required_amount, sent_amount
            )));
        }

        // Check if excess amount was sent
        if sent_amount > required_amount {
            return Err(StdError::generic_err(format!(
                "Excess native token sent. Required: {}, Sent: {}",
                required_amount, sent_amount
            )));
        }

        Ok(())
    }

    fn validate_cw20_token_payment(
        deps: &Deps,
        env: &Env,
        info: &MessageInfo,
        token_address: &str,
        required_amount: Uint128,
    ) -> StdResult<Vec<CosmosMsg>> {
        // Query token balance
        let balance: cw20::BalanceResponse = deps.querier.query_wasm_smart(
            token_address,
            &cw20::Cw20QueryMsg::Balance {
                address: info.sender.to_string(),
            },
        )?;

        // Check if user has sufficient balance
        if balance.balance < required_amount {
            return Err(StdError::generic_err(format!(
                "Insufficient CW20 token balance. Required: {}, Balance: {}",
                required_amount, balance.balance
            )));
        }

        // Query allowance
        let allowance: cw20::AllowanceResponse = deps.querier.query_wasm_smart(
            token_address,
            &cw20::Cw20QueryMsg::Allowance {
                owner: info.sender.to_string(),
                spender: env.contract.address.to_string(),
            },
        )?;

        // Check if contract has sufficient allowance
        if allowance.allowance < required_amount {
            return Err(StdError::generic_err(format!(
                "Insufficient CW20 token allowance. Required: {}, Allowance: {}",
                required_amount, allowance.allowance
            )));
        }

        let mut messages: Vec<CosmosMsg> = vec![];

        messages.push(
            WasmMsg::Execute {
                contract_addr: token_address.to_string(),
                msg: to_json_binary(&cw20::Cw20ExecuteMsg::TransferFrom {
                    owner: info.sender.to_string(),
                    recipient: env.contract.address.to_string(),
                    amount: required_amount,
                })?,
                funds: vec![],
            }
            .into(),
        );

        Ok(messages)
    }

    fn validate_intent_type(
        intent_type: &IntentType,
        config: &Config,
    ) -> Result<(), ContractError> {
        match intent_type {
            IntentType::Swap { output_tokens } => {
                for token in output_tokens {
                    if !config.supported_tokens.contains(&token.token) {
                        return Err(ContractError::UnsupportedToken {});
                    }
                }
            }
            _ => return Err(ContractError::Unimplemented {}),
        }
        Ok(())
    }

    fn validate_filling(
        deps: &DepsMut,
        env: &Env,
        info: &MessageInfo,
        intent_id: &str,
        intent_type: &IntentType,
    ) -> Result<(Vec<BeepCoin>, Vec<CosmosMsg>), ContractError> {
        let mut tokens = ESCROW
            .load(deps.storage, (&info.sender, intent_id))
            .unwrap_or_default();
        let mut msgs = vec![];

        match intent_type {
            IntentType::Swap { output_tokens } => {
                for token in output_tokens {
                    if token.is_native {
                        // Find the coin with matching denom in the sent funds
                        let sent_amount = info
                            .funds
                            .iter()
                            .find(|coin| coin.denom == token.token)
                            .map(|coin| coin.amount)
                            .unwrap_or_default();

                        // Check if sent amount matches required amount
                        if sent_amount < token.amount {
                            return Err(ContractError::Std(StdError::generic_err(format!(
                                "Insufficient native token sent. Required: {}, Sent: {}",
                                token.amount, sent_amount
                            ))));
                        }
                    } else {
                        let transfer_from_msg = validate_cw20_token_payment(
                            &deps.as_ref(),
                            env,
                            info,
                            &token.token,
                            token.amount,
                        )?;

                        msgs = [msgs, transfer_from_msg].concat();
                    }

                    // Add token to escrow
                    tokens.push(BeepCoin {
                        token: token.token.clone(),
                        amount: token.amount,
                        is_native: token.is_native,
                    });
                }
            }
            _ => return Err(ContractError::Unimplemented {}),
        }

        Ok((tokens, msgs))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_json_binary(&query::query_config(deps)?),
        QueryMsg::GetConnection { chain_id } => {
            to_json_binary(&query::query_connection(deps, chain_id)?)
        }
        QueryMsg::GetIntent { id } => to_json_binary(&query::query_intent(deps, id)?),
        QueryMsg::ListIntents { start_after, limit } => {
            to_json_binary(&query::query_list_intents(deps, start_after, limit)?)
        }
        QueryMsg::GetUserNonce { address } => {
            to_json_binary(&query::query_get_user_nonce(deps, address)?)
        }
    }
}

pub mod query {
    use cosmwasm_std::Addr;
    use cw_storage_plus::Bound;

    use crate::{
        msg::{
            ConfigResponse, ConnectionResponse, IntentResponse, IntentsResponse, UserNonceResponse,
        },
        state::{Intent, CONFIG, IBC_CONNECTIONS, INTENTS, USER_NONCE},
    };

    use super::*;

    pub fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
        let config = CONFIG.load(deps.storage)?;
        Ok(ConfigResponse {
            admin: config.admin,
            supported_tokens: config.supported_tokens,
            default_timeout_height: config.default_timeout_height,
        })
    }

    pub fn query_connection(deps: Deps, chain_id: String) -> StdResult<ConnectionResponse> {
        let connection = IBC_CONNECTIONS.load(deps.storage, &chain_id)?;

        Ok(ConnectionResponse {
            chain_id: connection.chain_id,
            port: connection.port,
            channel_id: connection.channel_id,
        })
    }

    pub fn query_intent(deps: Deps, id: String) -> StdResult<IntentResponse> {
        let intent = INTENTS.load(deps.storage, &id)?;
        Ok(IntentResponse { intent })
    }

    pub fn query_list_intents(
        deps: Deps,
        start_after: Option<String>,
        limit: Option<u32>,
    ) -> StdResult<IntentsResponse> {
        let start = start_after.unwrap();
        let limit = limit.unwrap_or(10) as usize;

        let intents: StdResult<Vec<Intent>> = INTENTS
            .range(
                deps.storage,
                Some(Bound::exclusive(&*start)),
                None,
                cosmwasm_std::Order::Ascending,
            )
            .take(limit)
            .map(|item| item.map(|(_, intent)| intent))
            .collect();

        Ok(IntentsResponse { intents: intents? })
    }

    pub fn query_get_user_nonce(deps: Deps, address: Addr) -> StdResult<UserNonceResponse> {
        let nonce = USER_NONCE.load(deps.storage, &address)?;
        Ok(UserNonceResponse { nonce })
    }
}

#[cfg(test)]
mod tests {}
