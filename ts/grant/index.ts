import {
  Account,
  transactions,
  providers,
  DEFAULT_FUNCTION_CALL_GAS,
  u8,
  i8,
  u16,
  i16,
  u32,
  i32,
  u64,
  i64,
  f32,
  f64,
  BN,
  ChangeMethodOptions,
  ViewFunctionOptions,
} from './helper';

/**
* StorageUsage is used to count the amount of storage used by a contract.
*/
export type StorageUsage = u64;
/**
* Balance is a type for storing amounts of tokens, specified in yoctoNEAR.
*/
export type Balance = U128;
/**
* Represents the amount of NEAR tokens in "gas units" which are used to fund transactions.
*/
export type Gas = u64;
/**
* base64 string.
*/
export type Base64VecU8 = string;
/**
* Raw type for duration in nanoseconds
*/
export type Duration = u64;
/**
* @minLength 2
* @maxLength 64
* @pattern ^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$
*/
export type AccountId = string;
/**
* @minLength 2
* @maxLength 64
* @pattern ^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$
*/
export type ValidAccountId = string;
/**
* String representation of a u128-bit integer
* @pattern ^[0-9]+$
*/
export type U128 = string;
/**
* Public key in a binary format with base58 string serialization with human-readable curve.
* The key types currently supported are `secp256k1` and `ed25519`.
* 
* Ed25519 public keys accepted are 32 bytes and secp256k1 keys are the uncompressed 64 format.
*/
export type PublicKey = string;
/**
* Raw type for timestamp in nanoseconds
*/
export type Timestamp = u64;
export interface Config {
  version: string;
  owner_id: AccountId;
  operators: AccountId[];
  current_round?: Round;
  fee_point: u32;
  default_duration: u32;
  default_vote_cost: U128;
  fee_amount: U128;
  motivation: string;
}
export interface Project {
  name: string;
  description: string;
  external_url: string;
  image: string;
  round_id: RoundId;
  owner: AccountId;
  created_at: u32;
  total_votes: u64;
  grants: U128;
  support_area: u64;
  withdrawn: U128;
}
export type ProjectId = [RoundId, AccountId];
export enum RoundStatus {
  Active = "Active",
  Finished = "Finished",
}
export interface Round {
  created_at: u32;
  end_at: u32;
  pure_support_pool: U128;
  id: RoundId;
  start_at: u32;
  support_area: u64;
  support_pool: U128;
  vote_cost: U128;
  status: RoundStatus;
}
export type RoundId = u64;

export class Contract {
  
  constructor(public account: Account, public readonly contractId: string){}
  
  config(args = {}, options?: ViewFunctionOptions): Promise<Config> {
    return this.account.viewFunction(this.contractId, "config", args, options);
  }
  async sudo_config(args: {
    fee_point?: u32;
    default_duration?: u32;
    default_vote_cost?: U128;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.sudo_configRaw(args, options));
  }
  sudo_configRaw(args: {
    fee_point?: u32;
    default_duration?: u32;
    default_vote_cost?: U128;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "sudo_config", args, ...options});
  }
  sudo_configTx(args: {
    fee_point?: u32;
    default_duration?: u32;
    default_vote_cost?: U128;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("sudo_config", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async set_owner(args: {
    new_owner_id: AccountId;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.set_ownerRaw(args, options));
  }
  set_ownerRaw(args: {
    new_owner_id: AccountId;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "set_owner", args, ...options});
  }
  set_ownerTx(args: {
    new_owner_id: AccountId;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("set_owner", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  /**
  * Get operators
  */
  operators(args = {}, options?: ViewFunctionOptions): Promise<AccountId[]> {
    return this.account.viewFunction(this.contractId, "operators", args, options);
  }
  /**
  * Extend operators. Only can be called by owner.
  */
  async extend_operators(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.extend_operatorsRaw(args, options));
  }
  /**
  * Extend operators. Only can be called by owner.
  */
  extend_operatorsRaw(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "extend_operators", args, ...options});
  }
  /**
  * Extend operators. Only can be called by owner.
  */
  extend_operatorsTx(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("extend_operators", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  /**
  * Remove operators. Only can be called by owner.
  */
  async remove_operators(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.remove_operatorsRaw(args, options));
  }
  /**
  * Remove operators. Only can be called by owner.
  */
  remove_operatorsRaw(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "remove_operators", args, ...options});
  }
  /**
  * Remove operators. Only can be called by owner.
  */
  remove_operatorsTx(args: {
    operators: AccountId[];
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("remove_operators", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async new_project(args: {
    name: string;
    description: string;
    external_url: string;
    image: string;
  }, options?: ChangeMethodOptions): Promise<Project> {
    return providers.getTransactionLastResult(await this.new_projectRaw(args, options));
  }
  new_projectRaw(args: {
    name: string;
    description: string;
    external_url: string;
    image: string;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "new_project", args, ...options});
  }
  new_projectTx(args: {
    name: string;
    description: string;
    external_url: string;
    image: string;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("new_project", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  grant_for(args: {
    project_id: ProjectId;
  }, options?: ViewFunctionOptions): Promise<U128> {
    return this.account.viewFunction(this.contractId, "grant_for", args, options);
  }
  async withdraw(args: {
    project_id: ProjectId;
    amount: U128;
  }, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.withdrawRaw(args, options));
  }
  withdrawRaw(args: {
    project_id: ProjectId;
    amount: U128;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "withdraw", args, ...options});
  }
  withdrawTx(args: {
    project_id: ProjectId;
    amount: U128;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("withdraw", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  project(args: {
    project_id: ProjectId;
  }, options?: ViewFunctionOptions): Promise<Project | null> {
    return this.account.viewFunction(this.contractId, "project", args, options);
  }
  projects(args: {
    limit?: u32;
    offset?: u32;
  }, options?: ViewFunctionOptions): Promise<Project[]> {
    return this.account.viewFunction(this.contractId, "projects", args, options);
  }
  projects_for_owner(args: {
    owner_id: AccountId;
    limit?: u32;
    offset?: u32;
  }, options?: ViewFunctionOptions): Promise<Project[]> {
    return this.account.viewFunction(this.contractId, "projects_for_owner", args, options);
  }
  async vote(args: {
    project_id: ProjectId;
    votes: u64;
  }, options?: ChangeMethodOptions): Promise<Project> {
    return providers.getTransactionLastResult(await this.voteRaw(args, options));
  }
  voteRaw(args: {
    project_id: ProjectId;
    votes: u64;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "vote", args, ...options});
  }
  voteTx(args: {
    project_id: ProjectId;
    votes: u64;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("vote", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async sudo_new_default_round(args = {}, options?: ChangeMethodOptions): Promise<Round> {
    return providers.getTransactionLastResult(await this.sudo_new_default_roundRaw(args, options));
  }
  sudo_new_default_roundRaw(args = {}, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "sudo_new_default_round", args, ...options});
  }
  sudo_new_default_roundTx(args = {}, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("sudo_new_default_round", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async sudo_new_round(args: {
    start_at: u32;
    end_at: u32;
  }, options?: ChangeMethodOptions): Promise<Round> {
    return providers.getTransactionLastResult(await this.sudo_new_roundRaw(args, options));
  }
  sudo_new_roundRaw(args: {
    start_at: u32;
    end_at: u32;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "sudo_new_round", args, ...options});
  }
  sudo_new_roundTx(args: {
    start_at: u32;
    end_at: u32;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("sudo_new_round", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async sudo_update_current_round(args: {
    danger: boolean;
    status?: RoundStatus;
    start_at?: u32;
    end_at?: u32;
  }, options?: ChangeMethodOptions): Promise<Round> {
    return providers.getTransactionLastResult(await this.sudo_update_current_roundRaw(args, options));
  }
  sudo_update_current_roundRaw(args: {
    danger: boolean;
    status?: RoundStatus;
    start_at?: u32;
    end_at?: u32;
  }, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "sudo_update_current_round", args, ...options});
  }
  sudo_update_current_roundTx(args: {
    danger: boolean;
    status?: RoundStatus;
    start_at?: u32;
    end_at?: u32;
  }, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("sudo_update_current_round", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async sudo_finish_current_round(args = {}, options?: ChangeMethodOptions): Promise<Round> {
    return providers.getTransactionLastResult(await this.sudo_finish_current_roundRaw(args, options));
  }
  sudo_finish_current_roundRaw(args = {}, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "sudo_finish_current_round", args, ...options});
  }
  sudo_finish_current_roundTx(args = {}, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("sudo_finish_current_round", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  round(args: {
    round_id: RoundId;
  }, options?: ViewFunctionOptions): Promise<Round | null> {
    return this.account.viewFunction(this.contractId, "round", args, options);
  }
  rounds(args: {
    limit?: u32;
    offset?: u32;
  }, options?: ViewFunctionOptions): Promise<Record<Round, u32>> {
    return this.account.viewFunction(this.contractId, "rounds", args, options);
  }
  async donate(args = {}, options?: ChangeMethodOptions): Promise<Round> {
    return providers.getTransactionLastResult(await this.donateRaw(args, options));
  }
  donateRaw(args = {}, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "donate", args, ...options});
  }
  donateTx(args = {}, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("donate", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
  async init(args = {}, options?: ChangeMethodOptions): Promise<void> {
    return providers.getTransactionLastResult(await this.initRaw(args, options));
  }
  initRaw(args = {}, options?: ChangeMethodOptions): Promise<providers.FinalExecutionOutcome> {
    return this.account.functionCall({contractId: this.contractId, methodName: "init", args, ...options});
  }
  initTx(args = {}, options?: ChangeMethodOptions): transactions.Action {
    return transactions.functionCall("init", args, options?.gas ?? DEFAULT_FUNCTION_CALL_GAS, options?.attachedDeposit ?? new BN(0))
  }
}
/**
* 
* @contractMethod view
*/
export interface Config {
  args: {};
  
}
export type Config__Result = Config;
/**
* 
* @contractMethod change
*/
export interface SudoConfig {
  args: {
    fee_point?: u32;
    default_duration?: u32;
    default_vote_cost?: U128;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SudoConfig__Result = void;
/**
* 
* @contractMethod change
*/
export interface SetOwner {
  args: {
    new_owner_id: AccountId;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SetOwner__Result = void;
/**
* Get operators
* 
* @contractMethod view
*/
export interface Operators {
  args: {};
  
}
export type Operators__Result = AccountId[];
/**
* Extend operators. Only can be called by owner.
* 
* @contractMethod change
*/
export interface ExtendOperators {
  args: {
    operators: AccountId[];
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type ExtendOperators__Result = void;
/**
* Remove operators. Only can be called by owner.
* 
* @contractMethod change
*/
export interface RemoveOperators {
  args: {
    operators: AccountId[];
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type RemoveOperators__Result = void;
/**
* 
* @contractMethod change
*/
export interface NewProject {
  args: {
    name: string;
    description: string;
    external_url: string;
    image: string;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type NewProject__Result = Project;
/**
* 
* @contractMethod view
*/
export interface GrantFor {
  args: {
    project_id: ProjectId;
  };
  
}
export type GrantFor__Result = U128;
/**
* 
* @contractMethod change
*/
export interface Withdraw {
  args: {
    project_id: ProjectId;
    amount: U128;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type Withdraw__Result = void;
/**
* 
* @contractMethod view
*/
export interface Project {
  args: {
    project_id: ProjectId;
  };
  
}
export type Project__Result = Project | null;
/**
* 
* @contractMethod view
*/
export interface Projects {
  args: {
    limit?: u32;
    offset?: u32;
  };
  
}
export type Projects__Result = Project[];
/**
* 
* @contractMethod view
*/
export interface ProjectsForOwner {
  args: {
    owner_id: AccountId;
    limit?: u32;
    offset?: u32;
  };
  
}
export type ProjectsForOwner__Result = Project[];
/**
* 
* @contractMethod change
*/
export interface Vote {
  args: {
    project_id: ProjectId;
    votes: u64;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type Vote__Result = Project;
/**
* 
* @contractMethod change
*/
export interface SudoNewDefaultRound {
  args: {};
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SudoNewDefaultRound__Result = Round;
/**
* 
* @contractMethod change
*/
export interface SudoNewRound {
  args: {
    start_at: u32;
    end_at: u32;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SudoNewRound__Result = Round;
/**
* 
* @contractMethod change
*/
export interface SudoUpdateCurrentRound {
  args: {
    danger: boolean;
    status?: RoundStatus;
    start_at?: u32;
    end_at?: u32;
  };
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SudoUpdateCurrentRound__Result = Round;
/**
* 
* @contractMethod change
*/
export interface SudoFinishCurrentRound {
  args: {};
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type SudoFinishCurrentRound__Result = Round;
/**
* 
* @contractMethod view
*/
export interface Round {
  args: {
    round_id: RoundId;
  };
  
}
export type Round__Result = Round | null;
/**
* 
* @contractMethod view
*/
export interface Rounds {
  args: {
    limit?: u32;
    offset?: u32;
  };
  
}
export type Rounds__Result = Record<Round, u32>;
/**
* 
* @contractMethod change
*/
export interface Donate {
  args: {};
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type Donate__Result = Round;
/**
* 
* @contractMethod change
*/
export interface Init {
  args: {};
  options: {
    /** Units in gas
    * @pattern [0-9]+
    * @default "30000000000000"
    */
    gas?: string;
    /** Units in yoctoNear
    * @default "0"
    */
    attachedDeposit?: Balance;
  }
  
}
export type Init__Result = void;
