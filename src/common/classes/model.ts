export abstract class Model<T> {
  abstract pk: keyof T;
  abstract attributes: T;

  getPk(): string | number {
    return this.attributes[this.pk] as unknown as string | number;
  }
}