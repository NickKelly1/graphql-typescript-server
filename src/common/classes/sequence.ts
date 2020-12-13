export class Sequence {
  protected _value: number;

  constructor(
    initial: number,
  ) {
    this._value = initial - 1;
  }

  next(): number {
    return (this._value += 1);
  }

  reset(to: number) {
    this._value = to - 1;
  }
}