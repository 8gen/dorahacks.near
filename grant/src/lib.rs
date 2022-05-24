use std::collections::HashMap;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

pub use crate::project::{Project, ProjectId};
pub use crate::round::{Round, RoundId};
use near_sdk::collections::{TreeMap, UnorderedMap, UnorderedSet};
use near_sdk::ONE_NEAR;
use near_sdk::{env, json_types::U128, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};
use witgen;

mod config;
mod macros;
mod owner;
mod project;
mod round;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    owner_id: AccountId,
    operators: UnorderedSet<AccountId>,
    projects: TreeMap<ProjectId, Project>,
    rounds_for_owner: UnorderedMap<AccountId, UnorderedSet<RoundId>>,
    grants: UnorderedMap<AccountId, HashMap<ProjectId, U128>>,
    votes: UnorderedMap<AccountId, HashMap<ProjectId, u64>>,
    round_projects: UnorderedMap<RoundId, UnorderedSet<ProjectId>>,
    rounds: TreeMap<RoundId, Round>,
    current_round_id: RoundId,
    fee_point: u32,
    fee_amount: U128,
    default_duration: u32,
    default_vote_cost: U128,
}

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    Operators,
    Votes,
    Rounds,
    Grants,
    RoundProjects,
    RoundsForOwner,
    Projects,
    AccountRounds { account_id: AccountId },
    ProjectsPerRound { round_id: RoundId },
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn init() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            owner_id: env::predecessor_account_id(),
            operators: UnorderedSet::new(StorageKey::Operators),
            fee_point: 500, // 5.00%
            fee_amount: 0.into(),
            default_duration: 60 * 60 * 24 * 31,
            default_vote_cost: (ONE_NEAR / 10).into(),
            current_round_id: 0,
            votes: UnorderedMap::new(StorageKey::Votes),
            grants: UnorderedMap::new(StorageKey::Grants),
            rounds: TreeMap::new(StorageKey::Rounds),
            rounds_for_owner: UnorderedMap::new(StorageKey::RoundsForOwner),
            round_projects: UnorderedMap::new(StorageKey::RoundProjects),
            projects: TreeMap::new(StorageKey::Projects),
        }
    }
}
