import { IGQLType } from "prisma-datamodel";
import { ICache } from "./cache/cache";
import { SimpleCache } from "./cache/simple-cache";
import { BaseEntity } from "./entity";
import { Repository } from "./repository";
import { GetGen, Constructor } from "./type-helpers";
import {
  Client as PrismaClient,
  ObjectType,
  GetRepositoryFromEntity,
  GetRepositoryFromName
} from "./types";
import { arrayToMap } from "./utils";

export class EntityManager<Client extends PrismaClient> {
  public entitiesMap: Record<string, BaseEntity<string>>;
  public customeEntitiesMap: Record<string, BaseEntity<string>>;
  public entities: { modelName: string }[];
  public customEntities: { modelName: string }[];

  public cache: ICache;
  public client: Client;
  public modelNameToMetadata: Record<string, IGQLType>;
  protected repositoriesCache: Record<string, Repository<any, Client>>;

  constructor(input: {
    client: Client;
    baseEntities: (Constructor<BaseEntity<string>> & { modelName: string })[];
    customEntities?: (Constructor<BaseEntity<string>> & {
      modelName: string;
    })[];
    cache?: ICache;
  }) {
    /**
     * Should be stored in the base entities during code-generation step or read from the client
     */
    const typesMetadata = input.client.getDatamodel().types;
    this.modelNameToMetadata = arrayToMap(typesMetadata, t => t.name);

    this.cache = input.cache || new SimpleCache();
    this.client = input.client;
    this.entities = input.baseEntities;
    this.customEntities = input.customEntities || [];
    this.entitiesMap = arrayToMap(input.baseEntities, e => e.modelName);
    this.customeEntitiesMap = arrayToMap(this.customEntities, e => e.modelName);
    this.repositoriesCache = {};
  }

  getRepository<Entity extends keyof GetGen<"repositories">>(
    entity: Entity
  ): GetRepositoryFromName<Entity>;
  getRepository<Entity extends new (...args: any[]) => BaseEntity<string>>(
    entity: Entity
  ): GetRepositoryFromEntity<Entity>;
  getRepository<Entity extends any>(entity: Entity): any {
    const modelName =
      typeof entity === "string" ? entity : (entity as any).modelName;

    if (
      typeof entity !== "string" &&
      !this.entities.includes(entity as any) &&
      !this.customEntities.includes(entity as any)
    ) {
      throw new Error(
        `Entity not found: ${modelName}. Register it in the entity manager constructor.`
      );
    }

    const metadata = this.modelNameToMetadata[modelName];

    if (this.repositoriesCache[modelName]) {
      return this.repositoriesCache[modelName] as any;
    }

    if (!metadata) {
      throw new Error(`Could not find metadata for model: "${entity}"`);
    }

    const newRepository = new Repository<any, any>(this, metadata);
    this.repositoriesCache[modelName] = newRepository;

    return newRepository as any;
  }

  getCustomRepository<T>(repository: ObjectType<T>): T {
    const metadata = this.modelNameToMetadata[(repository as any).modelName];

    if (!metadata) {
      throw new Error(
        `Could not find metadata for model: "${(repository as any).modelName}"`
      );
    }

    const instance = new (repository as any)(this, metadata);

    return instance;
  }
}
