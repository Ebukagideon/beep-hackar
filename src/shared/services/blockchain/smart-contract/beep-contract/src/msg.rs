use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;

use crate::state::{BeepCoin, Intent, IntentType};

#[cw_serde]
pub struct InstantiateMsg {
    pub supported_tokens: Vec<String>,
    pub default_timeout_height: u64,
    pub supported_protocols: Vec<String>,
}

#[cw_serde]
pub enum IbcExecuteMsg {
    FillIntent { intent_id: String, executor: Addr },
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateIntent {
        input_tokens: Vec<BeepCoin>,
        intent_type: IntentType,
        target_chain_id: String,
        timeout: Option<u64>,
    },
    FillIntent {
        intent_id: String,
        source_chain_id: String,
        intent_type: IntentType,
    },
    WithdrawIntentFund {
        intent_id: String,
    },
    UpdateAdmin {
        new_admin: Addr,
    },
    AddSupportedTokens {
        tokens: Vec<String>,
    },
    RemoveSupportedTokens {
        tokens: Vec<String>,
    },
    AddSupportedProtocols {
        protocols: Vec<String>,
    },
    RemoveSupportedProtocols {
        protocols: Vec<String>,
    },
    UpdateDefaultTimeoutHeight {
        default_timeout_height: u64,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ConfigResponse)]
    GetConfig {},
    #[returns(ConnectionResponse)]
    GetConnection { chain_id: String },
    #[returns(IntentResponse)]
    GetIntent { id: String },
    #[returns(IntentsResponse)]
    ListIntents {
        start_after: Option<String>,
        limit: Option<u32>,
    },
}

// We define a custom struct for each query response
#[cw_serde]
pub struct ConfigResponse {
    pub admin: Addr,
    pub supported_tokens: Vec<String>,
    pub default_timeout_height: u64,
}

#[cw_serde]
pub struct ConnectionResponse {
    pub chain_id: String,
    pub port: String,
    pub channel_id: String,
}

#[cw_serde]
pub struct IntentResponse {
    pub intent: Intent,
}

#[cw_serde]
pub struct IntentsResponse {
    pub intents: Vec<Intent>,
}
