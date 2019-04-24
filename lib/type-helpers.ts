declare global {
  interface PrismaEntity {}
}

export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Helpers for handling the generated types
 */
export type GenTypesShapeKeys = "models" | "repositories" | "selects";

export type GenTypesShape = Record<GenTypesShapeKeys, any>;

export type GetGen<
  K extends GenTypesShapeKeys,
  Fallback = any
> = PrismaEntity extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? GenTypes[K]
    : Fallback
  : Fallback;

export type GetGen2<
  K extends GenTypesShapeKeys,
  K2 extends keyof GenTypesShape[K]
> = PrismaEntity extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? K2 extends keyof GenTypes[K]
        ? GenTypes[K][K2]
        : any
      : any
    : any
  : any;
