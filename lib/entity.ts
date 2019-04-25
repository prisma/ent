export class BaseEntity<Model extends string> {
  // Required for Typescript not to ignore the `Model` generic and allow to infer
  private __INTERNAL__MODEL__NAME__: Model;
}

export class InternalBaseEntity<Model extends string> {
  static modelName: string;
}
