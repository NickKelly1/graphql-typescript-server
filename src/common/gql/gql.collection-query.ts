import { GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";


export interface ICollectionQueryInput {
  filters?: null | { [field: string]: undefined | null | string | number; };
  sorts?: null | { field: string, dir: 'Asc' | 'Desc' }[];
  limit?: null | number;
  offset?: null | number;
}
export const CollectionQueryInput = new GraphQLInputObjectType({
  name: 'CollectionQueryInput',
  fields: () => ({
    filters: {
      type: new GraphQLInputObjectType({
        name: 'CollectionQueryFilter',
        fields: () => ({
          id: { type: GraphQLFloat, },
          name: { type: GraphQLString, },
        }),
      }),
    },
    sorts: {
      type: GraphQLList(GraphQLNonNull(new GraphQLInputObjectType({
        name: 'CollectionQuerySort',
        fields: () => ({
          field: { type: GraphQLNonNull(GraphQLString), },
          dir: {
            type: GraphQLNonNull(new GraphQLEnumType({
              name: 'CollectionQuerySortDirection',
              values: {
                Asc: { value: 'Asc' },
                Desc: { value: 'Desc' },
              },
            })),
          },
        }),
      }))),
    },
    limit: { type: GraphQLFloat },
    offset: { type: GraphQLFloat },
  }),
});
