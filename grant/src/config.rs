pub use crate::owner::*;
use crate::*;

use near_sdk::{near_bindgen, AccountId};
use serde::{Deserialize, Serialize};

#[near_bindgen]
#[witgen::witgen]
#[derive(Deserialize, Serialize)]
pub struct Config {
    version: String,
    owner_id: AccountId,
    operators: Vec<AccountId>,
    current_round: Option<Round>,
    fee_point: u32,
    default_duration: u32,
    default_vote_cost: U128,
    fee_amount: U128,
    motivation: String,
}

#[near_bindgen]
impl Contract {
    pub fn get_config(&self) -> Config {
        Config {
            version: env!("CARGO_PKG_VERSION").to_string(),
            owner_id: self.owner_id.clone(),
            operators: self.operators.to_vec(),
            fee_point: self.fee_point,
            fee_amount: self.fee_amount,
            default_duration: self.default_duration,
            default_vote_cost: self.default_vote_cost,
            current_round: self.rounds.get(&self.current_round_id),
            motivation: "In Rust we trust".to_string(),
        }
    }

    pub fn sudo_config(
        &mut self,
        fee_point: Option<u32>,
        default_duration: Option<u32>,
        default_vote_cost: Option<U128>,
    ) {
        self.assert_owner_or_operator();
        update_if_some!(self, default_vote_cost);
        update_if_some!(self, default_duration);
        update_if_some!(self, fee_point);
    }
}
