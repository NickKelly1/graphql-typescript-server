import { Thunk, GraphQLFieldConfigMap, GraphQLNonNull, GraphQLInputObjectType, GraphQLFloat } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { CollectionQueryInput } from "../common/gql/gql.collection-query";
import { AccountCollectionNode, IAccountCollectionNodeSource } from "./account.gql.collection.node";
import Joi from 'joi';
import { AccountNode, IAccountNodeSource } from "./account.gql.node";
import { validateInput } from "../common/helpers/validate-input.helper";
import HttpErrors from "http-errors";

interface IWithdrawInput { account_id: number; amount: number; }
const WithdrawInput = new GraphQLInputObjectType({
  name: 'Withdraw',
  fields: () => ({
    account_id: { type: GraphQLNonNull(GraphQLFloat), },
    amount: { type: GraphQLNonNull(GraphQLFloat), },
  }),
});
const WithdrawInputValidator = Joi.object<IWithdrawInput>({
  account_id: Joi.number().required(),
  amount: Joi.number().positive().required(),
})

interface IDepositInput { account_id: number; amount: number; }
const DepositInput = new GraphQLInputObjectType({
  name: 'Deposit',
  fields: () => ({
    account_id: { type: GraphQLNonNull(GraphQLFloat), },
    amount: { type: GraphQLNonNull(GraphQLFloat), },
  }),
});
const DepositInputValidator = Joi.object<IDepositInput>({
  account_id: Joi.number().required(),
  amount: Joi.number().positive().required(),
})


// Return a function (thunk) with the query fields to reduce the change of nasty import races
export const AccountMutation: Thunk<GraphQLFieldConfigMap<unknown, GqlContext>> = () => ({
  /**
   * Withdraw from an account
   */
  withdraw: {
    // tell Gql to resolve the returned object as an AccountNode
    type: GraphQLNonNull(AccountNode),

    args: { dto: { type: GraphQLNonNull(WithdrawInput), }, },

    // Resolve to the AccountNodeSource type
    resolve: async (parent, args, ctx): Promise<IAccountNodeSource> => {
      // validate the input
      const dto = validateInput(WithdrawInputValidator, args.dto);

      // in production grade app, run this function body within a transaction for consistency

      const account = await ctx
        .services
        .accountRepository
        .firstOrFail({ filters: { id: dto.account_id }});

      // if the Requester is not authorised to view the account,
      // throw 404 so they aren't even notified of its existance
      if (!ctx.services.accountPolicy.canFindOne({ model: account })) {
        throw new HttpErrors.NotFound();
      }

      // authorise that the Requester can Deposit into the Account
      if (!ctx.services.accountPolicy.canWithdraw({ model: account })) {
        throw new HttpErrors.Forbidden('Cannot withdraw from this account');
      }

      // withdraw from the account...
      await ctx
        .services
        .accountService
        .withdraw({
          model: account,
          dto: { amount: dto.amount, }
        });
      console.log('withdrew...');

      return account;
    },
  },

  /**
   * Deposit into an account
   */
  deposit: {
    // tell Gql to resolve the returned object as an AccountNode
    type: GraphQLNonNull(AccountNode),

    args: { dto: { type: GraphQLNonNull(DepositInput), }, },

    // Resolve to the AccountNodeSource type
    resolve: async (parent, args, ctx): Promise<IAccountNodeSource> => {
      // validate the input
      const dto = validateInput(DepositInputValidator, args.dto);

      // in production grade app, run this function body within a transaction for consistency

      const account = await ctx
        .services
        .accountRepository
        .firstOrFail({ filters: { id: dto.account_id }});

      // if the Requester is not authorised to view the account,
      // throw 404 so they aren't even notified of its existance
      if (!ctx.services.accountPolicy.canFindOne({ model: account })) {
        throw new HttpErrors.NotFound();
      }

      // authorise that the Requester can Deposit into the Account
      if (!ctx.services.accountPolicy.canDeposit({ model: account })) {
        throw new HttpErrors.Forbidden('Cannot deposit into this account');
      }

      // deposit into the account...
      await ctx
        .services
        .accountService
        .deposit({
          model: account,
          dto: { amount: dto.amount, }
        });

      return account;
    },
  },
});
