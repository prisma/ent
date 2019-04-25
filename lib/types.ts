import { BaseEntity } from "./entity";
import { GetGen2, GetGen, Constructor } from "./type-helpers";
import { ISDL } from "prisma-datamodel";

export type GetModelName<T extends BaseEntity<string>> = T extends BaseEntity<
  infer U
>
  ? U
  : never;

export type GetSelectType<T extends string> = GetGen2<"selects", T>;

export type GetRepositoryFromEntity<
  T extends new (...args: any[]) => BaseEntity<string>
> = GetModelName<InstanceType<T>> extends keyof GetGen<"repositories">
  ? GetGen2<"repositories", GetModelName<InstanceType<T>>>
  : never;
export type GetRepositoryFromName<
  T extends keyof GetGen<"repositories">
> = GetGen2<"repositories", T>;

export type EntityType<T extends keyof GetGen<"models">> = GetGen2<"models", T>;

export type ObjectType<T> = { new (...args: any[]): T } | Function;
export type BaseEntities = Array<
  Constructor<GetGen<"baseEntities">> & {
    modelName: string;
  }
>;
export type CustomEntities = Array<
  Constructor<GetGen<"customEntities">> & { modelName: string }
>;

export type FindOneRepoOptions<T extends string> = {
  select?: GetSelectType<T>;
  first?: number;
  id: string;
};

export type FindManyRepoOptions<T extends string> = {
  select?: GetSelectType<T>;
  where?: object;
  first?: number;
  last?: number;
};

export interface Client {
  getDatamodel(): ISDL;
  [x: string]: any;
}
