

export interface IFindOneOptions {
  filters?: null | { [field: string]: undefined | null | string | number; };
  sorts?: null | [string, 'Asc' | 'Desc'][];
}

export interface IFindOptions extends IFindOneOptions {
  limit?: null | number;
  offset?: null | number;
}