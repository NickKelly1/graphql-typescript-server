import { BaseContext } from "../common/classes/base.context";
import { BaseRepository } from "../common/classes/base.repository";
import { ITransactionAttributes, TransactionModel } from "./transaction.model";
import faker from 'faker';
import { Sequence } from "../common/classes/sequence";

const init: ITransactionAttributes[] = [
  { id: 1, account_id: 1, description: faker.company.companyName(), amount: 2_500, },
  { id: 2, account_id: 1, description: faker.company.companyName(), amount: 1_000, },
  { id: 3, account_id: 1, description: faker.company.companyName(), amount: 1_500, },

  // savings => 15_000
  { id: 4, account_id: 2, description: faker.company.companyName(), amount: 2_500, },
  { id: 5, account_id: 2, description: faker.company.companyName(), amount: 3_000, },
  { id: 6, account_id: 2, description: faker.company.companyName(), amount: 4_500, },
  { id: 7, account_id: 2, description: faker.company.companyName(), amount: 5_000, },

  // term => 50_000
  { id: 8, account_id: 3, description: faker.company.companyName(), amount: 40_000, },
  { id: 9, account_id: 3, description: faker.company.companyName(), amount: 10_000, },

  // shares => 150_000
  { id: 10, account_id: 4, description: faker.company.companyName(), amount: 100_000, },
  { id: 11, account_id: 4, description: faker.company.companyName(), amount: 50_000, },

  // travel => 300
  { id: 12, account_id: 5, description: faker.company.companyName(), amount: 300, },
];


export class TransactionRepository extends BaseRepository<TransactionModel> {
  public readonly sequence: Sequence;

  constructor(
    ctx: BaseContext,
  ) {
    super(ctx, init.map(attributes => new TransactionModel({ ...attributes })));
    this.sequence = new Sequence(13);
  }
}
