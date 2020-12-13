export const Extractor = (arg: { fromObj: Record<PropertyKey, any>, fromName: string }) => {
  const { fromObj, fromName } = arg;

  function extract(name: string): string | undefined { return fromObj[name] };
  function extractAssert(name: string): string {
    const val = extract(name);
    if (val === undefined) throw new ReferenceError(`${fromName} "${name}" must be defined`);
    return val;
  }

  const to = ({
    optional<T>(fn: () => T): undefined | T {
      try {
        const result = fn();
        return result;
      } catch(err) {
        return undefined;
      }
    },

    string(name: string): string {
      const val = extractAssert(name);
      return val;
    },

    number(name: string): number {
      const val = Number(extractAssert(name));
      if (!Number.isFinite(val)) throw new TypeError(`${fromName} "${name}" must be a number`);
      return val;
    },

    int(name: string): number {
      let val = parseInt(extractAssert(name), 10);
      if (!Number.isFinite(val)) throw new TypeError(`${fromName} "${name}" must be a number`);
      return val;
    },

    bool(name: string): boolean {
      let raw = extractAssert(name).trim().toLowerCase();
      if (raw === 'true') return true;
      if (raw === '1') return true;
      if (raw === 'false') return false;
      if (raw === '0') return false;
      throw new TypeError(`${fromName} "${name}" must be a boolean`);
    },

    oneOf: <T extends string>(arg: T[]) => (name: string): T => {
      let val = extractAssert(name);
      if (!arg.some(acceptable => acceptable === val)) {
        throw new TypeError(`${fromName} "${name}" must be one of ${arg.map(String).join(', ')}`);
      }
      return val as T;
    },

    subsetOf: <T extends string>(arg: T[]) => (name: string): T[] => {
      let raw = extract(name) ?? '';
      const strs = raw.split(',').filter(Boolean);
      const extra = strs.filter(val => !arg.some(ar => ar === val));
      if (extra.length) throw new TypeError(`${fromName} "${name}" has unexpectd values: "${extra.join(',')}"`);
      return strs as T[];
    }
  }) as const;

  return to;
};