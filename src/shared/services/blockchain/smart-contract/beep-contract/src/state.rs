use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Binary, Uint128};
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub supported_tokens: Vec<String>, // denom and token address
    pub default_timeout_height: u64,   // 2 minutes
    pub supported_protocols: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Connection {
    pub chain_id: String,
    pub port: String,
    pub channel_id: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct Intent {
    pub id: String,
    pub creator: Addr,
    pub input_tokens: Vec<BeepCoin>,
    pub intent_type: IntentType,
    pub origin_chain_id: String,
    pub target_chain_id: String,
    pub executor: Option<Addr>,
    pub status: IntentStatus,
    pub created_at: u64,
    pub timeout: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct BeepCoin {
    pub token: String,
    pub amount: Uint128,
    pub is_native: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub enum IntentStatus {
    Active,
    Pending,
    Completed,
    Failed,
    Expired,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub enum IntentType {
    Swap {
        output_tokens: Vec<ExpectedToken>,
    },
    LiquidStake {
        validator: String,
        output_denom: String,
    },
    Lend {
        protocol: String,
        interest_rate_mode: u8,
    },
    Generic {
        action_type: String,
        params: Binary,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct ExpectedToken {
    pub token: String,
    pub is_native: bool,
    pub amount: Uint128,
    pub target_address: Option<Addr>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct FillIntent {
    pub intent_id: String,
    pub executor: Addr,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const IBC_CONNECTIONS: Map<&str, Connection> = Map::new("connections"); // chain_id -> Connection
pub const INTENTS: Map<&str, Intent> = Map::new("intents"); // intent_id -> Intent
pub const USER_ESCROW: Map<(&Addr, &str), Vec<BeepCoin>> = Map::new("user_escrow"); // (address, intent_id) -> Bag of money
pub const EXECUTOR_ESCROW: Map<(&Addr, &str), Vec<BeepCoin>> = Map::new("executor_escrow"); // (address, intent_id) -> Bag of money
pub const USER_NONCE: Map<Addr, u128> = Map::new("user_nonce");
