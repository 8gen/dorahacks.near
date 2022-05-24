use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

use near_sdk::collections::UnorderedSet;
use near_sdk::{env, json_types::U128, near_bindgen, AccountId, PanicOnDefault, PromiseOrValue};
use near_sdk::{require, Promise};
use serde::{Deserialize, Serialize};
use witgen;

use crate::*;

#[witgen::witgen]
#[near_bindgen]
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Project {
    pub name: String,
    pub description: String,
    pub external_url: String,
    pub image: String,
    pub round_id: RoundId,
    pub owner: AccountId,
    pub created_at: u32,
    pub total_votes: u64,
    pub grants: U128,
    pub support_area: u64,
    pub withdrawn: U128,
}

#[witgen::witgen]
pub type ProjectId = (RoundId, AccountId);

impl Project {}

impl Contract {
    pub fn is_project_exists(&self, project_id: &ProjectId) -> bool {
        self.projects.contains_key(project_id)
    }

    pub fn assert_unique_project(&self, project_id: &ProjectId) {
        require!(!self.is_project_exists(project_id), "ERR_PROJECT_EXISTS_IN_ROUND");
    }
}

#[near_bindgen]
impl Contract {
    pub fn new_project(
        &mut self,
        name: String,
        description: String,
        external_url: String,
        image: String,
    ) -> Project {
        let project_id: ProjectId = (self.current_round_id, env::predecessor_account_id());
        self.assert_unique_project(&project_id);
        let project = Project {
            name,
            description,
            external_url,
            image,
            round_id: self.current_round_id,
            owner: env::predecessor_account_id(),
            created_at: (env::block_timestamp_ms() / 1_000) as u32,
            total_votes: 0,
            grants: U128(0),
            support_area: 0,
            withdrawn: 0.into(),
        };
        self.projects.insert(&project_id, &project);
        {
            let mut rounds =
                self.round_projects.get(&self.current_round_id).expect("ERR_ROUND_NOT_FOUND");
            rounds.insert(&project_id);
            self.round_projects.insert(&self.current_round_id, &rounds);
        }
        {
            let mut rounds = self.rounds_for_owner.get(&env::predecessor_account_id()).unwrap_or(
                UnorderedSet::new(StorageKey::AccountRounds {
                    account_id: env::predecessor_account_id(),
                }),
            );
            rounds.insert(&self.current_round_id);
            self.rounds_for_owner.insert(&env::predecessor_account_id(), &rounds);
        }
        project
    }

    pub fn grant_for(&self, project_id: ProjectId) -> (U128, U128) {
        let project = self.projects.get(&project_id).expect("ERR_PROJECT_NOT_FOUND");
        let round = self.round(project.round_id).expect("ERR_ROUND_NOT_FOUND");
        if round.id == self.current_round_id && round.is_active() {
            (U128(0), U128(0))
        } else {
            let mut granted = project.grants.0;
            if round.support_area > 0 {
                granted += project.support_area as u128 * round.support_pool.0
                    / round.support_area as u128;
            }
            (U128(granted - project.withdrawn.0), U128(granted))
        }
    }

    pub fn withdraw(&mut self, project_id: ProjectId, amount: U128) -> PromiseOrValue<U128> {
        let mut project = self.projects.get(&project_id).expect("ERR_PROJECT_NOT_FOUND");
        self.round(project.round_id).expect("ERR_ROUND_NOT_FOUND");
        let (withdrawable, _) = self.grant_for(project_id.clone());
        require!(amount.0 <= withdrawable.0, "ERR_TOO_MUCH");
        project.withdrawn = U128(project.withdrawn.0 + amount.0);
        self.projects.insert(&project_id.clone(), &project);
        Promise::new(project.owner).transfer(amount.0).into()
    }

    pub fn project(&self, project_id: ProjectId) -> Option<Project> {
        self.projects.get(&project_id)
    }

    pub fn projects(&self, limit: Option<u32>, offset: Option<u32>) -> Vec<Project> {
        let limit = limit.unwrap_or(u32::MAX);
        let offset = offset.unwrap_or(0);
        self.projects
            .iter()
            .skip(offset as usize)
            .take(limit as usize)
            .map(|(_, project)| project)
            .collect()
    }

    pub fn projects_for_owner(
        &self,
        owner_id: AccountId,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Vec<Project> {
        let limit = limit.unwrap_or(u32::MAX);
        let offset = offset.unwrap_or(0);
        match self.rounds_for_owner.get(&owner_id) {
            Some(rounds) => rounds
                .iter()
                .skip(offset as usize)
                .take(limit as usize)
                .map(|round_id| self.projects.get(&(round_id, owner_id.clone())).unwrap())
                .collect(),
            _ => {
                vec![]
            }
        }
    }

    #[payable]
    pub fn vote(&mut self, project_id: ProjectId, votes: u64) -> Project {
        let voter = env::predecessor_account_id();
        let storage_used = env::storage_usage();
        let mut round: Round = self.round(project_id.0).expect("ERR_ROUND_NOT_FOUND");
        require!(round.is_active(), "ERR_ROUND_NOT_ACTIVE");
        require!(project_id.0 == self.current_round_id, "ERR_ROUND_WRONG");

        let mut project = self.projects.get(&project_id).expect("ERR_PROJECT_NOT_FOUND");

        let mut user_votes = self.votes.get(&voter).unwrap_or(HashMap::new());
        let voted = *user_votes.get(&project_id).unwrap_or(&0);

        let mut user_grants = self.grants.get(&voter).unwrap_or(HashMap::new());
        let granted = *user_grants.get(&project_id).unwrap_or(&U128(0));

        let weight = votes * (votes + 1) / 2 + votes * voted;
        let cost = weight as u128 * round.vote_cost.0;
        let platform_fee = cost * self.fee_point as u128 / 10000;
        let grants = cost - platform_fee;
        let support_area = votes * (project.total_votes - voted);

        self.fee_amount = U128(self.fee_amount.0 + platform_fee);

        user_votes.insert(project_id.clone(), voted + votes);
        self.votes.insert(&voter, &user_votes);

        user_grants.insert(project_id.clone(), U128(granted.0 + grants));
        self.grants.insert(&voter, &user_grants);

        project.total_votes += votes;
        project.support_area += support_area;
        project.grants = U128(project.grants.0 + grants);
        self.projects.insert(&project_id, &project);

        round.support_area += support_area;
        self.rounds.insert(&project_id.0, &round);

        let storage_cost =
            (env::storage_usage() - storage_used) as u128 * env::STORAGE_PRICE_PER_BYTE;

        require!(cost + storage_cost <= env::attached_deposit(), "ERR_NOT_ENOUGH");

        if cost + storage_cost < env::attached_deposit() {
            Promise::new(voter).transfer(env::attached_deposit() - cost - storage_cost);
        }
        project
    }
}
