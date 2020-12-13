import { GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLString, GraphQLBoolean } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { CollectionQueryInput } from "../common/gql/gql.collection-query";
import { getPageInfo } from "../common/helpers/get-page-info.helper";
import { parseQuery } from "../common/helpers/parse-query.helper";
import { TransactionCollectionNode, ITransactionCollectionNodeSource } from "../transaction/transaction.gql.collection.node";
import { TransactionModel } from "../transaction/transaction.model";
import { AccountModel } from "./account.model";

/**
 * AccountNode
 * Gql representation of a Account
 */
export type IAccountNodeSource = AccountModel;
export const AccountNode = new GraphQLObjectType<IAccountNodeSource, GqlContext>({
  name: 'AccountNode',
  fields: () => ({
    // account data
    data: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<IAccountNodeSource, GqlContext>({
        name: 'AccountData',
        fields: {
          id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.id, },
          name: { type: GraphQLNonNull(GraphQLString), resolve: (parent): string => parent.attributes.name, },
          balance: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.balance, },
          owner_id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.owner_id, },
          // more fields...
        },
      })),
    },

    // account actions
    can: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<IAccountNodeSource, GqlContext>({
        name: 'AccountActions',
        fields: () => ({
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canFindOne({ model: parent });
            },
          },
          withdraw: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canWithdraw({ model: parent });
            },
          },
          deposit: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canDeposit({ model: parent });
            },
          },
        }),
      })),
    },

    // account relations
    relations: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(AccountRelations),
    },
  }),
});


// we extract relations from the super object to avoid circular references
// that TypeScript doesn't like
const AccountRelations: GraphQLObjectType<IAccountNodeSource, GqlContext> = new GraphQLObjectType<IAccountNodeSource, GqlContext>({
  name: 'AccountRelations',
  fields: () => ({
    transactions: {
      // tell Gql to resolve the returned object as an TransactionCollectionNode
      type: GraphQLNonNull(TransactionCollectionNode),

      // Query GraphQLInput of type Transaction (gets parsed into TransactionRepository options)
      args: { query: { type: CollectionQueryInput, }, },

      // Resolve to the TransactionNodeSource type
      resolve: async (parent, args, ctx): Promise<ITransactionCollectionNodeSource> => {
        // parse the Gql Query Input into repository options
        const options = parseQuery(args.query);

        // retrieve models from storage
        // the repository should scope the results given the request context
        // and not return any results the requester would be unauthorised to view
        const results  = await ctx
          .services
          .transactionRepository
          .findAllAndCount({
            ...options,
            filters: {
              ...options.filters,
              account_id: parent.attributes.id,
            },
          });

        // remove models that the requester is unauthorised to view
        // and that weren't caught by the dynamic filter scope in the repository
        const findableModels: (null | TransactionModel)[] = await Promise.all(results
          .rows
          .map(async (model) => {
            return ctx
              .services
              .transactionPolicy.canFindOne({ model, account: parent })
                ? model
                : null
          })
        );

        // paginated collection nodes have pageInfo describing the results...
        const pageInfo = getPageInfo(options, results);

        // resolve (return) to the source required for a TransactionCollectionNode
        const collectionSource: ITransactionCollectionNodeSource = {
          nodes: findableModels,
          pageInfo,
        };

        return collectionSource;
      },
    },
  }),
})