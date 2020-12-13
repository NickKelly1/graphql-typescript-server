import { BaseContext } from "../common/classes/base.context";
import { BaseRepository } from "../common/classes/base.repository";
import { Sequence } from "../common/classes/sequence";
import { User } from "../user/user.const";
import { AccountModel, IAccountAttributes } from "./account.model";

// const 
const init: IAccountAttributes[] = [
  { id: 1, name: 'Checking', balance: 5_000, owner_id: User.Public },
  { id: 2, name: 'Savings', balance: 15_000, owner_id: User.Public },
  { id: 3, name: 'Term', balance: 50_000, owner_id: User.Public },
  { id: 4, name: 'Shares', balance: 150_000, owner_id: User.Public },
  { id: 5, name: 'Travel', balance: 300, owner_id: User.Public },
];

export class AccountRepository extends BaseRepository<AccountModel> {
  public readonly sequence: Sequence;

  constructor(
    ctx: BaseContext,
  ) {
    super(ctx, init.map(attributes => new AccountModel({ ...attributes })));
    this.sequence = new Sequence(6);
  }
}