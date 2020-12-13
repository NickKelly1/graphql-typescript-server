import { IFindOneOptions, IFindOptions } from "../types/find-options.type";
import HttpErrors from 'http-errors';
import { BaseContext } from "./base.context";
import { ModelCollection, IRowsWithTotal } from "./model-collection";
import { Sequence } from "./sequence";
import { Model } from "./model";


export abstract class BaseRepository<T extends Model<any>> {
  // give every request a standard set of accounts for the demo...

  protected modelsByPk: Record<string | number, T>;

  constructor(
    protected readonly ctx: BaseContext,
    protected models: T[],
  ) {
    this.modelsByPk = {};
    models.forEach(model => { this.modelsByPk[model.getPk()] = model; });
  }


  /**
   * In a production grade application, this would be a light wrapper around an ORM or driver function
   *
   * @param options
   */
  async findAllAndCount(options: IFindOptions): Promise<IRowsWithTotal<T>> {
    const { filters, limit, offset, sorts, } = options;

    const results = await new ModelCollection(this.models)
      .filter(filters)
      .sort(sorts)
      .limit(limit)
      .offset(offset)
      .findAllAndCount();

    return results;
  }


  /**
   * Find the first instance of a model given the filters
   *
   * @param options
   */
  async first(options: IFindOneOptions): Promise<T | null> {
    const { filters, sorts } = options;

    const [result] = await new ModelCollection(this.models)
      .filter(filters)
      .sort(sorts)
      .limit(1)
      .offset(0)
      .findAll();

    return result ?? null;
  }


  /**
   * Find the first instance of a model given the filters, or 404
   *
   * @param options
   */
  async firstOrFail(options: IFindOneOptions): Promise<T> {
    const result = await this.first(options);
    if (!result) { throw new HttpErrors.NotFound(); }
    return result;
  }


  /**
   * Save a model
   *
   * @param arg
   */
  async save(arg: { model: T }): Promise<void> {
    const { model: target } = arg;
    const targetPk = target.getPk();
    const match = this.findByPk(targetPk);
    if (match) {
      // replace existing record
      const index = this.models.findIndex(other => other.getPk() === targetPk);
      if (index === -1) throw new HttpErrors.InternalServerError();
      this.models[index] = target;
      this.modelsByPk[targetPk] = target;
    } else {
      // push new record
      this.models.push(target);
      this.modelsByPk[targetPk] = target;
    }
  }



  /**
   * Find a model by primary key
   *
   * @param pk
   */
  protected findByPk(pk: string | number): null | T {
    const result = this.modelsByPk[pk];
    return result ?? null;
  }
}
