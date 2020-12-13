import { Permission } from "../../permission/permission.const";
import { User } from "../../user/user.const";
import { ServiceContainer } from "./service.container";


/**
 * Request Context
 */
export abstract class BaseContext {
  // for demonstration, grant all requests these permissions to each requester:
  protected readonly _permissions = new Set([
    Permission.SuperAdmin.SuperAdmin,
    Permission.Account.ViewOwn,
    Permission.Account.Create,
    Permission.Account.UpdateOwn,
    Permission.Account.DepositOwn,
    Permission.Account.WithdrawOwn,
    Permission.Account.Admin,
    Permission.Transaction.ViewOwn,
  ]);

  public readonly services: ServiceContainer;

  // grant the Public user to all requests...
  user_id: null | number = User.Public;

  constructor(
    //
  ) {
    this.services = new ServiceContainer(this);
  }

  /**
   * Does the context have any of the given permissions?
   *
   * @param check
   */
  hasPermission(...check: number[]): boolean {
    // check if any of the permissions exist in the set of permissions
    // that the Requester has
    return check.some(this._permissions.has.bind(this._permissions));
  }
}