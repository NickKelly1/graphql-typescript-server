import { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLBoolean } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { IPageInfoSource, PageInfo } from "../common/gql/gql.page-info";
import { AccountNode, IAccountNodeSource } from "./account.gql.node";
import { AccountModel } from "./account.model";

export interface IAccountCollectionNodeSource {
  nodes: (null | AccountModel)[];
  pageInfo: IPageInfoSource;
  // ...other collection metadata
}
export const AccountCollectionNode = new GraphQLObjectType<IAccountCollectionNodeSource, GqlContext>({
  name: 'AccountCollectionNode',
  fields: () => ({
    // Nodes
    nodes: {
      // tell Gql to resolve this as an array of AccountNode's
      type: GraphQLNonNull(GraphQLList(AccountNode)),
      // return as an array of (null | (AccountNode sources))
      // null if the requester was not authorised to view the node
      resolve: (parent): (null | IAccountNodeSource)[] => parent.nodes,
    },
    // PageInfo
    pageInfo: {
      type: GraphQLNonNull(PageInfo),
      resolve: (parent): IPageInfoSource => parent.pageInfo,
    },
    // Collection Actions
    can: {
      resolve: (parent): unknown => undefined,
      type: GraphQLNonNull(new GraphQLObjectType<unknown, GqlContext>({
        name: 'AccountCollectionActions',
        fields: {
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canFindMany();
            },
          },
        }
      })),
    },
  }),
});
