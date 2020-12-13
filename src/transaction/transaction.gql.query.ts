import { Thunk, GraphQLFieldConfigMap, GraphQLNonNull } from "graphql";
import HttpError from 'http-errors';
import { GqlContext } from "../common/classes/gql.context";
import { CollectionQueryInput } from "../common/gql/gql.collection-query";
import { getPageInfo } from "../common/helpers/get-page-info.helper";
import { parseQuery } from "../common/helpers/parse-query.helper";
import { TransactionCollectionNode, ITransactionCollectionNodeSource } from "./transaction.gql.collection.node";
import { TransactionModel } from "./transaction.model";

// Return a function (thunk) with the query fields to reduce the change of nasty import races
export const TransactionQuery: Thunk<GraphQLFieldConfigMap<unknown, GqlContext>> = () => ({
  /**
   * Find Transactions
   */
  transactions: {
    // tell Gql to resolve the returned object as an TransactionCollectionNode
    type: GraphQLNonNull(TransactionCollectionNode),

    // Query GraphQLInput of type Transaction (gets parsed into TransactionRepository options)
    args: { query: { type: CollectionQueryInput, }, },

    // Resolve to the TransactionNodeSource type
    resolve: async (parent, args, ctx): Promise<ITransactionCollectionNodeSource> => {

      // can the requester can show ANY Transactions?
      if (!ctx.services.transactionPolicy.canFindMany()) {
        // for a production grade application internationalise
        // the error using the request ctx's accepted languages
        throw new HttpError.Forbidden('Cannot Find Transactions');
      }

      // parse the Gql Query Input into repository options
      const options = parseQuery(args.query);

      // retrieve models from storage
      // the repository should scope the results given the request context
      // and not return any results the requester would be unauthorised to view
      const results  = await ctx
        .services
        .transactionRepository
        .findAllAndCount(options);

      // remove models that the requester is unauthorised to view
      // and that weren't caught by the dynamic filter scope in the repository
      const findableModels: (null | TransactionModel)[] = await Promise.all(results
        .rows
        .map(async (model) => {
          // in a production-ready app we would have loaded accounts with their transactions
          // to avoid additional loading like this
          const account = await ctx
            .services
            .accountRepository
            .first({ filters: { id: model.attributes.account_id } });
          if (!account) return null;
          return ctx
            .services
            .transactionPolicy.canFindOne({ model, account })
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
});
