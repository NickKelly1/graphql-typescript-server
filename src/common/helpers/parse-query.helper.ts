import { ICollectionQueryInput } from "../gql/gql.collection-query";
import { IFindOptions } from "../types/find-options.type";

export function parseQuery(input?: null | ICollectionQueryInput): IFindOptions {
  const options: IFindOptions = {
    filters: input?.filters,
    sorts: input?.sorts ? input.sorts.map(sort => [sort.field, sort.dir]) : undefined,
    limit: input?.limit,
    offset: input?.offset,
  };
  return options;
}