import { BaseContext } from "../common/classes/base.context";
import { Model } from "../common/classes/model";

export interface IAccountAttributes {
  id: number,
  name: string,
  balance: number,
  owner_id: number,
}

export class AccountModel extends Model<IAccountAttributes> {
  pk: 'id' = 'id';

  constructor(
    public attributes: IAccountAttributes,
  ) {
    super();
    //
  }


  /**
   * Does the requester own the model?
   *
   * @param ctx
   */
  isOwnedBy(ctx: BaseContext): boolean {
    return this.attributes.owner_id === ctx.user_id;
  }
}
