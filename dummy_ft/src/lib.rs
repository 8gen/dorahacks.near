use witgen;
use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata, FT_METADATA_SPEC, FungibleTokenMetadataProvider
};
use near_contract_standards::fungible_token::FungibleToken;
use near_sdk::json_types::U128;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedSet, LazyOption};
use near_sdk::{
    env, log, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault,
    PromiseOrValue, Balance,
};
pub use crate::owner::*;
mod owner;

#[near_bindgen]
#[witgen::witgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub operators: UnorderedSet<AccountId>,
    token: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
}

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey {
    FungibleToken,
    Metadata,
    Operator,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new_default_meta() -> Self {
        Self::new(
            env::predecessor_account_id(),
            1000.into(),
            FungibleTokenMetadata {
                spec: FT_METADATA_SPEC.to_string(),
                name: "Dummy FT".to_string(),
                symbol: "DUMMY".to_string(),
                icon: None,
                reference: None,
                reference_hash: None,
                decimals: 18,
            },
        )
    }

    /// Initializes the contract with the given total supply owned by the given `owner_id` with
    /// the given fungible token metadata.
    #[init]
    pub fn new(owner_id: AccountId, total_supply: U128, metadata: FungibleTokenMetadata) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        metadata.assert_valid();
        let mut this = Self {
            owner_id: owner_id.clone().into(),
            operators: UnorderedSet::new(StorageKey::Operator),
            token: FungibleToken::new(StorageKey::FungibleToken),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
        };
        this.token.internal_register_account(&owner_id.clone().into());
        this.token.internal_deposit(&owner_id.clone().into(), total_supply.into());
        this
    }

    pub fn mint(&mut self, receiver_id: AccountId, amount: U128) {
        assert_ne!(amount, U128(0), "must be more than 0.");
        self.token.internal_deposit(&receiver_id.into(), amount.into());
    }

    fn on_account_closed(&mut self, account_id: AccountId, balance: Balance) {
        log!("Closed @{} with {}", account_id, balance);
    }

    fn on_tokens_burned(&mut self, account_id: AccountId, amount: Balance) {
        log!("Account @{} burned {}", account_id, amount);
    }
}

near_contract_standards::impl_fungible_token_core!(Contract, token, on_tokens_burned);
near_contract_standards::impl_fungible_token_storage!(Contract, token, on_account_closed);

#[near_bindgen]
impl FungibleTokenMetadataProvider for Contract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }
}
