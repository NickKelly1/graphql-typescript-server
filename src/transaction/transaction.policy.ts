import { AccountModel } from "../account/account.model";
import { BaseContext } from "../common/classes/base.context";
import { Permission } from "../permission/permission.const";
import { TransactionModel } from "./transaction.model";

/**
 * TransactionPolicy
 * Used to authorise actions on TransactionModel's
 */
export class TransactionPolicy {
  constructor(
    protected readonly ctx: BaseContext,
  ) {
    //
  }

  /**
   * Can the Requester Find Transactions?
   */
  canFindMany(): boolean {
    return this.ctx.hasPermission(Permission.Transaction.ViewOwn);
  }

  /**
   * Can the Requester Find the Transaction?
   *
   * @param arg
   */
  canFindOne(arg: { account: AccountModel; model: TransactionModel }): boolean {
    const { account, model } = arg;

    // account must be Findable
    if (!this.ctx.services.accountPolicy.canFindOne({ model: account })) return false;

    // account must be owned by the Requester
    if (!account.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Transaction.ViewOwn);
  }
}
