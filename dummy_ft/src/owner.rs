use crate::*;
use near_sdk::{
    near_bindgen, assert_one_yocto
};


impl Contract {
    fn assert_owner(&self) {
        assert!(
            env::predecessor_account_id() == self.owner_id,
            "ERR_NOT_OWNER"
        );
    }
}

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn set_owner(
        &mut self,
        new_owner_id: AccountId
    ) {
        assert_one_yocto();
        self.assert_owner();
        self.owner_id = new_owner_id;
    }

    /// Extend operators. Only can be called by owner.
    #[payable]
    pub fn extend_operators(&mut self, operators: Vec<AccountId>) {
        assert_one_yocto();
        self.assert_owner();
        for operator in operators {
            self.operators.insert(&operator);
        }
    }

    /// Remove operators. Only can be called by owner.
    #[payable]
    pub fn remove_operators(&mut self, operators: Vec<AccountId>) {
        assert_one_yocto();
        self.assert_owner();
        for operator in operators {
            self.operators.remove(&operator);
        }
    }
}
