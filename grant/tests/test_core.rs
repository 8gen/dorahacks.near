#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use near_sdk::test_utils::test_env::alice;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::{testing_env, AccountId};

    use grant::*;

    const MINT_STORAGE_COST: u128 = 5870000000000000000000;

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    #[test]
    fn test_add_and_remove_operator() {
        let context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = Contract::init();
        assert_eq!(contract.operators().len(), 0);
        contract.extend_operators(vec![alice().into(), accounts(1).into()]);
        assert_eq!(contract.operators(), vec![alice(), accounts(1).into()]);
        contract.remove_operators(vec![accounts(1).into()]);
        assert_eq!(contract.operators(), vec![alice()]);
    }
}
