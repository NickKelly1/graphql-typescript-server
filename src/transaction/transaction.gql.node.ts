import { GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLString, GraphQLBoolean } from "graphql";
import { AccountNode, IAccountNodeSource } from "../account/account.gql.node";
import { GqlContext } from "../common/classes/gql.context";
import { TransactionModel } from "./transaction.model";

/**
 * TransactionNode
 * Gql representation of a Transaction
 */
export type ITransactionNodeSource = TransactionModel;
export const TransactionNode = new GraphQLObjectType<ITransactionNodeSource, GqlContext>({
  name: 'TransactionNode',
  fields: () => ({
    // transaction data
    data: {
      resolve: (parent): ITransactionNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<ITransactionNodeSource, GqlContext>({
        name: 'TransactionData',
        fields: {
          id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.id, },
          description: { type: GraphQLNonNull(GraphQLString), resolve: (parent): string => parent.attributes.description, },
          amount: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.amount, },
          account_id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.account_id, },
          // more fields...
        },
      })),
    },

    // transaction actions
    can: {
      resolve: (parent): ITransactionNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<ITransactionNodeSource, GqlContext>({
        name: 'TransactionActions',
        fields: {
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: async (parent, args, ctx): Promise<boolean> => {
              // in a production grade application, the account would be resolved using a DataLoader
              // to avoid additional io
              const account = await ctx.services.accountRepository.first({ filters: { id: parent.attributes.account_id } });
              if (!account) return false;
              return ctx.services.transactionPolicy.canFindOne({ account, model: parent });
            },
          },
        },
      })),
    },

    // transaction relations
    // ...
    relations: {
      resolve: (parent): ITransactionNodeSource => parent,
      type: GraphQLNonNull(TransactionRelations),
    },
  }),
});


// we extract relations from the super object to avoid circular references
// that TypeScript doesn't like
const TransactionRelations: GraphQLObjectType<ITransactionNodeSource, GqlContext> = new GraphQLObjectType<ITransactionNodeSource, GqlContext>({
  name: 'TransactionRelations',
  fields: () => ({
    account: {
      type: AccountNode,
      resolve: async (parent, args, ctx): Promise<null | IAccountNodeSource> => {
        // in a production grade application, the account would have been loaded &
        // primed in a dataloader to avoid having to refetch from storage
        const account = await ctx.services.accountRepository.first({ filters: { id: parent.attributes.account_id, }, });
        if (!account) return null;
        // if the Requester is not authorised to view this account, resolve null
        if (!ctx.services.accountPolicy.canFindOne({ model: account })) return null;
        return account;
      },
    },
  }),
});