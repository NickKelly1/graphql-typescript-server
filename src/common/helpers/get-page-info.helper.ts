import { IRowsWithTotal } from "../classes/model-collection";
import { IPageInfoSource } from "../gql/gql.page-info";
import { IFindOptions } from "../types/find-options.type";


/**
 * Get Gql PageInfo for a collection
 *
 * @param options
 * @param results
 */
export function getPageInfo<T>(options: IFindOptions, results: IRowsWithTotal<T>): IPageInfoSource {
  const page = Math.floor((options.offset ?? 0) / (options.limit || 1)) + 1;
  const pages = Math.ceil((results.total) / ((options.limit ?? results.total) || 1));
  const more = pages > page;
  return {
    page,
    pages,
    more,
    count: results.rows.length,
    total: results.total,
  };
}