import { BaseContext } from "../common/classes/base.context";
import { Model } from "../common/classes/model";

export interface ITransactionAttributes {
  id: number;
  description: string;
  amount: number;
  account_id: number;
}

export class TransactionModel extends Model<ITransactionAttributes> {
  pk: 'id' = 'id';

  constructor(
    public attributes: ITransactionAttributes,
  ) {
    super();
    //
  }
}
