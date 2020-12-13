import { BaseContext } from "../common/classes/base.context";
import { AccountModel } from "./account.model";

export interface IAccountServiceDepositDto {
  amount: number;
}

export interface IAccountServiceWithdrawDto {
  amount: number;
}

export class AccountService {
  constructor(protected readonly ctx: BaseContext) {
    //
  }

  /**
   * Deposit money into the account
   */
  async deposit(arg: {
    model: AccountModel;
    dto: IAccountServiceDepositDto;
  }): Promise<void> {
    const { model, dto } = arg;

    // create a transaction
    const transaction = await this
      .ctx
      .services
      .transactionService
      .create({
        account: model,
        dto: { amount: dto.amount, },
      });

    // update the account
    model.attributes.balance += transaction.attributes.amount;

    // save the account
    await this.ctx.services.accountRepository.save({ model });
  }

  /**
   * Withdraw money from the account
   */
  async withdraw(arg: {
    model: AccountModel;
    dto: IAccountServiceWithdrawDto;
  }): Promise<void> {
    const { model, dto } = arg;

    // create a transaction
    const transaction = await this
      .ctx
      .services
      .transactionService
      .create({
        account: model,
        dto: { amount: -dto.amount, },
      });

    // update the account
    model.attributes.balance += transaction.attributes.amount;

    // save the account
    await this.ctx.services.accountRepository.save({ model });
  }
}
