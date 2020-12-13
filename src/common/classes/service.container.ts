import { AccountPolicy } from "../../account/account.policy";
import { AccountRepository } from "../../account/account.repository";
import { AccountService } from "../../account/account.service";
import { TransactionPolicy } from "../../transaction/transaction.policy";
import { TransactionRepository } from "../../transaction/transaction.repository";
import { TransactionService } from "../../transaction/transaction.service";
import { BaseContext } from "./base.context";

export class ServiceContainer {
  public readonly accountPolicy: AccountPolicy;
  public readonly accountService: AccountService;
  public readonly accountRepository: AccountRepository;

  public readonly transactionPolicy: TransactionPolicy;
  public readonly transactionService: TransactionService;
  public readonly transactionRepository: TransactionRepository;

  constructor(
    ctx: BaseContext,
  ) {
    this.accountPolicy = new AccountPolicy(ctx);
    this.accountService = new AccountService(ctx);
    this.accountRepository = new AccountRepository(ctx);

    this.transactionPolicy = new TransactionPolicy(ctx);
    this.transactionService = new TransactionService(ctx);
    this.transactionRepository = new TransactionRepository(ctx);
  }
}