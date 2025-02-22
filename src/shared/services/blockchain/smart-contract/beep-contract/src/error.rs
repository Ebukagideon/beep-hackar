use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Unimplemented")]
    Unimplemented {},

    #[error("Invalid funds")]
    InvalidFunds {},

    #[error("Unsupported token")]
    UnsupportedToken {},

    #[error("Intent status mismatch")]
    InvalidStatus {},
}
