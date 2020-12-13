import { Extractor } from "../common/classes/extractor";
import dotenv from 'dotenv';

dotenv.config();

const extractor = Extractor({ fromObj: process.env, fromName: 'environment', });

class EnvSingletonKlass {
  readonly PORT: number = extractor.int('PORT');

  constructor() {
    //
  }
}

export const EnvSingleton: EnvSingletonKlass = new EnvSingletonKlass();