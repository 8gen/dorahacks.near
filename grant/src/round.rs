use crate::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

use near_sdk::require;
use near_sdk::{env, json_types::U128, near_bindgen};
use serde::{Deserialize, Serialize};
use witgen;

#[witgen::witgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, PartialEq, Debug)]
pub enum RoundStatus {
    Active,
    Finished,
}

#[witgen::witgen]
#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Round {
    pub created_at: u32,
    pub end_at: u32,
    pub pure_support_pool: U128,
    pub id: RoundId,
    pub start_at: u32,
    pub support_area: u64,
    pub support_pool: U128,
    pub vote_cost: U128,
    pub status: RoundStatus,
}

#[witgen::witgen]
pub type RoundId = u64;

impl Round {
    pub fn is_active(&self) -> bool {
        let now = (env::block_timestamp_ms() / 1_000) as u32;
        self.status == RoundStatus::Active && self.start_at <= now && self.end_at >= now
    }
}

#[near_bindgen]
impl Contract {
    pub fn sudo_new_default_round(&mut self) -> Round {
        let start_at = (env::block_timestamp_ms() / 1_000) as u32;
        let end_at = start_at + self.default_duration;
        self.sudo_new_round(start_at, end_at)
    }

    pub fn sudo_new_round(&mut self, start_at: u32, end_at: u32) -> Round {
        self.assert_owner_or_operator();
        require!(start_at < end_at, "ERR_WRONG_END_AT");
        if let Some(round) = self.rounds.get(&self.current_round_id) {
            require!(!round.is_active(), "ERR_ALREADY_ACTIVE_ROUND");
        };
        self.current_round_id += 1;
        let round = Round {
            id: self.current_round_id,
            created_at: (env::block_timestamp_ms() / 1_000) as u32,
            start_at,
            end_at,
            status: RoundStatus::Active,
            vote_cost: self.default_vote_cost,
            support_pool: 0.into(),
            pure_support_pool: 0.into(),
            support_area: 0,
        };
        self.rounds.insert(&self.current_round_id, &round);
        self.round_projects.insert(
            &self.current_round_id,
            &UnorderedSet::new(StorageKey::ProjectsPerRound { round_id: self.current_round_id }),
        );
        round
    }

    pub fn sudo_update_current_round(
        &mut self,
        danger: bool,
        status: Option<RoundStatus>,
        start_at: Option<u32>,
        end_at: Option<u32>,
    ) -> Round {
        self.assert_owner();
        require!(danger, "ERR_DO_NOT_PLAY_WITH_ME");
        let mut round = self.round(self.current_round_id).expect("ERR_ROUND_NOT_FOUND");
        update_if_some!(round, status);
        update_if_some!(round, start_at);
        update_if_some!(round, end_at);
        require!(round.start_at <= round.end_at, "ERR_WRONG_END_AT");
        self.rounds.insert(&self.current_round_id, &round);
        round
    }

    pub fn sudo_finish_current_round(&mut self) -> Round {
        self.assert_owner_or_operator();
        let mut round = self.round(self.current_round_id).expect("ERR_ROUND_NOT_FOUND");
        require!(!round.is_active(), "ERR_ROUND_ACTIVE");
        round.status = RoundStatus::Finished;
        self.rounds.insert(&self.current_round_id, &round);
        round
    }

    pub fn round(&self, round_id: RoundId) -> Option<Round> {
        self.rounds.get(&round_id)
    }

    pub fn rounds(&self, limit: Option<u32>, offset: Option<u32>) -> Vec<(Round, u32)> {
        let limit = limit.unwrap_or(u32::MAX);
        let offset = offset.unwrap_or(0);
        self.rounds
            .iter()
            .skip(offset as usize)
            .take(limit as usize)
            .map(|(round_id, round)| {
                (round, self.round_projects.get(&round_id).iter().len() as u32)
            })
            .collect()
    }

    #[payable]
    pub fn donate(&mut self) -> Round {
        let mut round: Round = self.round(self.current_round_id).expect("ERR_ROUND_NOT_FOUND");
        require!(round.is_active(), "ERR_ROUND_NOT_ACTIVE");
        let deposit = env::attached_deposit();
        let platform_fee = deposit * (self.fee_point as u128) / 10000;
        let donate = deposit - platform_fee;
        round.support_pool = U128(round.support_pool.0 + donate);
        round.pure_support_pool = U128(round.pure_support_pool.0 + deposit);
        self.rounds.insert(&self.current_round_id, &round);
        round
    }
}
