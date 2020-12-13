import { BaseContext } from "../common/classes/base.context";
import { Permission } from "../permission/permission.const";
import { AccountModel } from "./account.model";

/**
 * AccountPolicy
 * Used to authorise actions on AccountModel's
 *
 * Note:
 *  This is a very simple policy for demonstration purposes.
 *  Doesn't involve verifying against the state of the Account
 *  such as deactivated/active/frozen/overdrawn
 *  or checking if requester is SuperUser/Manager/Auditer/etc
 */
export class AccountPolicy {
  constructor(
    protected readonly ctx: BaseContext,
  ) {
    //
  }

  /**
   * Can the Requester Find Accounts?
   */
  canFindMany(): boolean {
    return this.ctx.hasPermission(Permission.Account.ViewOwn);
  }

  /**
   * Can the Requester Create an Account?
   */
  canCreate(): boolean {
    return this.ctx.hasPermission(Permission.Account.Create);
  }

  /**
   * Can the Requester Find the Account?
   *
   * @param arg
   */
  canFindOne(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.ViewOwn);
  }

  /**
   * Can the Requester Withdraw from the Account?
   *
   * @param arg
   */
  canWithdraw(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Findable
    if (!this.canFindOne({ model })) return false;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.WithdrawOwn);
  }

  /**
   * Can the Requester Deposit to the Account?
   *
   * @param arg
   */
  canDeposit(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Findable
    if (!this.canFindOne({ model })) return false;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.DepositOwn);
  }
}
