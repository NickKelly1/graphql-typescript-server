import { AccountModel } from "../account/account.model";
import { BaseContext } from "../common/classes/base.context";
import { TransactionModel } from "./transaction.model";
import faker from 'faker';

export interface ITransactionServiceCreateDto {
  amount: number;
}

export class TransactionService {
  constructor(protected readonly ctx: BaseContext) {
    //
  }

  /**
   * Create a new TransactionModel
   *
   * @param arg
   */
  async create(arg: {
    account: AccountModel;
    dto: ITransactionServiceCreateDto;
  }): Promise<TransactionModel> {
    const { account, dto, } = arg;
    const model = new TransactionModel({
      id: this.ctx.services.transactionRepository.sequence.next(),
      account_id: account.attributes.id,
      amount: dto.amount,
      description: faker.company.companyName(),
    });
    await this.ctx.services.transactionRepository.save({ model });
    return model;
  }
}
