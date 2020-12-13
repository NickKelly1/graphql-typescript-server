import { IFindOptions } from "../types/find-options.type";
import { Model } from "./model";

export interface IModelCollectionMetadata {
  prefilterCount?: number;
  postFilterCount?: number;
}

export interface IRowsWithTotal<T> { rows: T[]; total: number; };

export class ModelCollection<T extends Model<any>> {
  protected readonly metadata: IModelCollectionMetadata;

  /**
   * Constructor
   *
   * Not overridable
   *
   * @param items
   * @param metadata
   */
  constructor(
    protected readonly items: T[],
    metadata?: IModelCollectionMetadata,
  ) {
    if (metadata) {
      this.metadata = metadata;
    } else {
      this.metadata = {
        prefilterCount: items.length,
        postFilterCount: items.length,
      };
    }
  }


  /**
   * Create a new instance of the class
   *
   * @param from
   * @param metadata
   */
  protected New(from: T[], metadata: IModelCollectionMetadata): this {
    return new (this.constructor as any)(from, metadata);
  }


  /**
   * Apply filters to the collection
   *
   * @param filters
   */
  filter(filters?: IFindOptions['filters']): this {
    if (!filters) return this;
    let nextItems = [...this.items];
    Object.keys(filters).forEach(key => {
      const filter = filters[key];
      switch (typeof filter) {
        case 'undefined': {
          // do nothing...
          break;
        }
        case 'string': {
          nextItems = nextItems.filter(model => {
            const value = model.attributes[key as keyof T];
            if (value == undefined) return false;
            if (typeof value !== 'number' || typeof value !== 'string') return false;
            // match lowercase, anywhere in the string
            return String(value).toLowerCase().indexOf(filter) !== -1;
          })
          break;
        }
        case 'number': {
          nextItems = nextItems.filter(model => {
            const value = model.attributes[key as keyof T];
            if (value == undefined) return false;
            if (typeof value !== 'number' && typeof value !== 'string') return false;
            return Number(value) === filter;
          })
          break;
        }
        case 'object': {
          if (filter === null) {
            nextItems = nextItems.filter(model => {
              const value = model.attributes[key as keyof T];
              return value == undefined;
            });
          }
          else {
            // unhandled...
            console.warn(`Unhandled filter type: ${typeof filter}`);
          }
          break;
        }
        default: {
          // unhandled...
          console.warn(`Unhandled filter type: ${typeof filter}`);
        }
      }
    });

    const nextMetadata = {
      prefilterCount: this.items.length,
      ...this.metadata,
      postFilterCount: nextItems.length,
    };

    return this.New(nextItems, nextMetadata);
  }

  /**
   * Apply sorts to the collection
   *
   * @param sorts
   */
  sort(sorts?: IFindOptions['sorts']): this {
    if (!sorts) return this;
    const next = [...this.items];
    sorts.forEach(([key, dir]) => next.sort((a, b) => {
      const aVal = a.attributes[key as keyof T];
      const bVal = b.attributes[key as keyof T];
      let aRank: number;
      let bRank: number;

      // both strings
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aLc = aVal.toLowerCase();
        const bLc = bVal.toLowerCase();
        // compare strings
        if (aLc < bLc) {
          // a less b
          aRank = 0;
          bRank = 1;
        } else if (aLc > bLc) {
          // b less a
          aRank = 1;
          bRank = 0;
        } else {
          // equivalent
          aRank = 0;
          bRank = 0;
        }
      }

      // a numeric
      else if (typeof aVal === 'number') {
        // compare b if numeric, otherwise downrank b
        aRank = aVal;
        const bNum = Number(bVal);
        if (!isFinite(bNum)) { bRank = aRank + 1; }
        else bRank = bNum;
      }

      // b numeric
      else if (typeof bVal === 'number') {
        // b is numeric
        // compare a if numeric, otherwise downrank a
        bRank = bVal;
        const aNum = Number(aVal);
        if (!isFinite(aNum)) { aRank = bRank + 1; }
        else aRank = aNum;
      }

      // a & b are neither numeric nor string
      else {
        if (aVal == null && bVal != null) {
          // a nullable, b not => downrank a
          aRank = 1;
          bRank = 0;
        }
        else if (aVal != null && bVal == null) {
          // a not, b nullable => downrank b
          aRank = 0;
          bRank = 1;
        }
        else {
          // objects or something else - just return 0
          aRank = 0;
          bRank = 0;
        }
      }

      // asc
      if (dir === 'Asc') return aRank - bRank
      // desc
      return bRank - aRank
    }));

    return this.New(next, this.metadata);
  }


  /**
   * Limit the collection
   *
   * @param limit
   */
  limit(limit?: IFindOptions['limit']): this {
    if (limit == null) return this;
    return this.New(this.items.slice(0, limit), this.metadata);
  }


  /**
   * Offset the collection
   *
   * @param offset
   */
  offset(offset: IFindOptions['offset']): this {
    if (offset == null) return this;
    return this.New(this.items.slice(offset), this.metadata);
  }

  /**
   * Execute find items of the collection
   */
  async findAll(): Promise<T[]> {
    return this.items;
  }

  /**
   * Execute find items of the collection (acount count the postfiltered count)
   */
  async findAllAndCount(): Promise<IRowsWithTotal<T>> {
    return { rows: this.items, total: this.metadata.postFilterCount ?? this.items.length, };
  }
}
