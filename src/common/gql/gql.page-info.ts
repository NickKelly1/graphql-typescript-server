import { GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLBoolean } from "graphql";
import { GqlContext } from "../classes/gql.context";

export interface IPageInfoSource {
  page: number;
  pages: number;
  count: number;
  total: number;
  more: boolean;
} 

export const PageInfo = new GraphQLObjectType<IPageInfoSource, GqlContext>({
  name: 'PageInfo',
  fields: () => ({
    page: { type: GraphQLNonNull(GraphQLFloat), },
    pages: { type: GraphQLNonNull(GraphQLFloat), },
    count: { type: GraphQLNonNull(GraphQLFloat), },
    total: { type: GraphQLNonNull(GraphQLFloat), },
    more: { type: GraphQLNonNull(GraphQLBoolean), },
  }),
});
