import { IGQLField, IGQLType } from "prisma-datamodel";
import { EntityManager } from "./entity-manager";
import { BaseEntity } from "./entity";
import {
  FindOneRepoOptions,
  GetModelName,
  FindManyRepoOptions,
  Client as PrismaClient,
  ObjectType
} from "./types";

export class Repository<Entity extends BaseEntity<string>, Client extends any> {
  private modelNameToFindOne: Record<string, string>;
  private modelNameToFindMany: Record<string, string>;

  constructor(
    protected manager: EntityManager<Client>,
    protected metadata: IGQLType
  ) {
    this.modelNameToFindOne = this.generateModelNameToFindOne(metadata.name);
    this.modelNameToFindMany = this.generateModelNameToFindMany(metadata.name);
  }

  public async findOne(
    opts: FindOneRepoOptions<GetModelName<Entity>>
  ): Promise<Entity> {
    return this.internalFindOne(opts, this.metadata.name);
  }

  public async findMany(
    opts?: FindManyRepoOptions<GetModelName<Entity>>
  ): Promise<Entity[]> {
    return this.internalFindMany(opts || {}, this.metadata.name);
  }

  public transformToEntity(
    result: Record<string, any>,
    selectStatement?: Record<string, any>
  ): Entity {
    const entity = this.internalTransformToEntity(
      result,
      selectStatement,
      this.metadata.name
    );

    return entity as any;
  }

  private async internalFindOne(
    opts: FindOneRepoOptions<GetModelName<Entity>>,
    modelName: string
  ): Promise<Entity> {
    const cacheId = `findOne-${modelName}-${JSON.stringify(opts)}`;
    const cached = this.manager.cache.read(cacheId);

    if (cached) {
      return cached.data;
    }

    const result = await this.manager.client[
      this.modelNameToFindOne[modelName]
    ](opts);
    const entity = this.internalTransformToEntity(
      result,
      opts.select,
      modelName
    );

    this.manager.cache.write(cacheId, { data: entity });

    return entity as any;
  }

  private async internalFindMany(
    opts: FindManyRepoOptions<GetModelName<Entity>>,
    modelName: string
  ): Promise<Entity[]> {
    const cacheId = `findMany-${modelName}-${JSON.stringify(opts)}`;
    const cached = this.manager.cache.read(cacheId);

    if (cached) {
      return cached.data;
    }

    const results = await this.manager.client[
      this.modelNameToFindMany[modelName]
    ](opts);

    const entities = results.map((result: Record<string, any>) =>
      this.internalTransformToEntity(result, opts.select, modelName)
    );

    this.manager.cache.write(cacheId, { data: entities });

    return entities;
  }

  private async loadRelation(
    relation: IGQLField,
    parentName: string,
    parentId: string | undefined
  ) {
    const relationType = relation.type as IGQLType;

    if (relation.isList) {
      return this.internalFindMany(
        {
          where: { [this.modelNameToFindOne[parentName]]: { id: parentId } }
        } as any,
        relationType.name
      );
    }

    return this.internalFindOne({ id: parentId! }, relationType.name);
  }

  private internalTransformToEntity(
    result: Record<string, any>,
    selectStatement: Record<string, any> | undefined,
    modelName: string
  ): ObjectType<any> {
    const metadata = this.manager.modelNameToMetadata[modelName];

    const scalars = metadata.fields.filter(f => typeof f.type === "string");
    const relations = metadata.fields.filter(f => typeof f.type !== "string");

    let entityConstructorValues = scalars.reduce<Record<string, any>>(
      (acc, scalar) => {
        acc[scalar.name] = result[scalar.name];

        return acc;
      },
      {}
    );

    relations.forEach(relation => {
      const relationName = relation.name;

      if (relation.isList) {
        if (
          selectStatement &&
          selectStatement[relationName] &&
          result[relationName]
        ) {
          entityConstructorValues[relationName] = function() {
            return Promise.resolve(result[relation.name]);
          };
        } else {
          entityConstructorValues = this.enableLazyLoad(
            relation,
            metadata,
            entityConstructorValues
          );
        }
      }
    });

    const entityClass = this.manager.customeEntitiesMap[modelName]
      ? this.manager.customeEntitiesMap[modelName]
      : this.manager.entitiesMap[modelName];

    return new (entityClass as any)(entityConstructorValues as any);
  }

  private enableLazyLoad(
    relation: IGQLField,
    parent: IGQLType,
    entity: Record<string, any>
  ) {
    const relationLoader = this;
    const dataIndex = "__" + relation.name + "__"; // in what property of the entity loaded data will be stored
    const promiseIndex = "__promise_" + relation.name + "__"; // in what property of the entity loading promise will be stored
    const resolveIndex = "__has_" + relation.name + "__"; // indicates if relation data already was loaded or not, we need this flag if loaded data is empty

    entity[relation.name] = function() {
      if (this[resolveIndex] === true || this[dataIndex]) {
        // if related data already was loaded then simply return it
        return Promise.resolve(this[dataIndex]);
      }

      if (this[promiseIndex]) {
        // if related data is loading then return a promise relationLoader loads it
        return this[promiseIndex];
      }

      // nothing is loaded yet, load relation data and save it in the model once they are loaded
      this[promiseIndex] = relationLoader
        .loadRelation(relation, parent.name, entity.id)
        .then(result => {
          this[dataIndex] = result;
          this[resolveIndex] = true;
          delete this[promiseIndex];
          return this[dataIndex];
        });
      return this[promiseIndex];
    };

    return entity;
  }

  // TODO: Change hard-coded values by computed ones
  private generateModelNameToFindOne(_modelName: string) {
    return {
      User: "user",
      Post: "post"
    };
  }

  // TODO: Change hard-coded values by computed ones
  private generateModelNameToFindMany(_modelName: string) {
    return {
      User: "users",
      Post: "posts"
    };
  }
}
