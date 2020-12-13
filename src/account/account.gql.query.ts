import { Thunk, GraphQLFieldConfigMap, GraphQLNonNull } from "graphql";
import HttpErrors from 'http-errors';
import { GqlContext } from "../common/classes/gql.context";
import { CollectionQueryInput } from "../common/gql/gql.collection-query";
import { getPageInfo } from "../common/helpers/get-page-info.helper";
import { parseQuery } from "../common/helpers/parse-query.helper";
import { AccountCollectionNode, IAccountCollectionNodeSource } from "./account.gql.collection.node";
import { AccountModel } from "./account.model";

// Return a function (thunk) with the query fields to reduce the change of nasty import races
export const AccountQuery: Thunk<GraphQLFieldConfigMap<unknown, GqlContext>> = () => ({
  /**
   * Find Accounts
   */
  accounts: {
    // tell Gql to resolve the returned object as an AccountCollectionNode
    type: GraphQLNonNull(AccountCollectionNode),
    // Query GraphQLInput of type Account (gets parsed into AccountRepository options)
    args: { query: { type: CollectionQueryInput, }, },
    // Resolve to the AccountNodeSource type
    resolve: async (parent, args, ctx): Promise<IAccountCollectionNodeSource> => {

      // can the requester can show ANY Accounts?
      if (!ctx.services.accountPolicy.canFindMany()) {
        // for a production grade application internationalise
        // the error using the request ctx's languages
        throw new HttpErrors.Forbidden('Cannot Find Accounts');
      }

      // parse the Gql Query Input into repository options
      const options = parseQuery(args.query);

      // retrieve models from storage
      // the repository should scope the results given the request context
      // and not return any results the requester would be unauthorised to view
      const results  = await ctx
        .services
        .accountRepository
        .findAllAndCount(options);

      // remove models that the requester is unauthorised to view
      // and that weren't caught by the dynamic filter scope in the repository
      const findableModels: (null | AccountModel)[] = results.rows.map((model) => (
        ctx.services.accountPolicy.canFindOne({ model })
          ? model
          : null
      ));

      // paginated collection nodes have pageInfo describing the results...
      const pageInfo = getPageInfo(options, results);

      // resolve (return) to the source required for a AccountCollectionNode
      const collectionSource: IAccountCollectionNodeSource = {
        nodes: findableModels,
        pageInfo,
      };

      return collectionSource;
    },
  },
});
