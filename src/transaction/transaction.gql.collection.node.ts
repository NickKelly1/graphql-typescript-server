import { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLBoolean } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { GqlNone, IGqlNoneSource } from "../common/gql/gql.none";
import { IPageInfoSource, PageInfo } from "../common/gql/gql.page-info";
import { TransactionNode, ITransactionNodeSource } from "./transaction.gql.node";
import { TransactionModel } from "./transaction.model";

export interface ITransactionCollectionNodeSource {
  nodes: (null | TransactionModel)[];
  pageInfo: IPageInfoSource;
  // ...other collection metadata
}
export const TransactionCollectionNode = new GraphQLObjectType<ITransactionCollectionNodeSource, GqlContext>({
  name: 'TransactionCollectionNode',
  fields: () => ({
    // Nodes
    nodes: {
      // tell Gql to resolve this as an array of TransactionNode's
      type: GraphQLNonNull(GraphQLList(TransactionNode)),
      // return as an array of (null | (TransactionNode sources))
      // null if the requester was not authorised to view the node
      resolve: (parent): (null | ITransactionNodeSource)[] => parent.nodes,
    },
    // PageInfo
    pageInfo: {
      type: GraphQLNonNull(PageInfo),
      resolve: (parent): IPageInfoSource => parent.pageInfo,
    },
    // Collection Actions
    can: {
      resolve: (parent): IGqlNoneSource => GqlNone,
      type: GraphQLNonNull(new GraphQLObjectType<IGqlNoneSource, GqlContext>({
        name: 'TransactionCollectionActions',
        fields: {
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.transactionPolicy.canFindMany();
            },
          },
        }
      })),
    },
  }),
});
