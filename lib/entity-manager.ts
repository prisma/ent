import { IGQLType } from "prisma-datamodel";
import { ICache } from "./cache/cache";
import { SimpleCache } from "./cache/simple-cache";
import { BaseEntity, InternalBaseEntity } from "./entity";
import { Repository } from "./repository";
import { GetGen } from "./type-helpers";
import {
  Client as PrismaClient,
  ObjectType,
  GetRepositoryFromEntity,
  GetRepositoryFromName,
  BaseEntities,
  CustomEntities
} from "./types";
import { arrayToMap } from "./utils";
import { codegen } from "./codegen";

export class EntityManager<Client extends any = any> {
  public entitiesMap: Record<string, InternalBaseEntity<string>>;
  public customeEntitiesMap: Record<string, InternalBaseEntity<string>>;
  public baseEntities: BaseEntities;
  public customEntities: CustomEntities;

  public cache: ICache;
  public client: Client;
  public modelNameToMetadata: Record<string, IGQLType>;
  protected repositoriesCache: Record<string, Repository<any, Client>>;

  constructor(input: {
    client: Client;
    entities: {
      baseEntities: BaseEntities;
      customEntities?: CustomEntities;
    };
    typegen:
      | false
      | {
          entitiesPath: string[];
          clientPath: string;
        };
    cache?: ICache;
  }) {
    /**
     * Should be stored in the base entities during code-generation step or read from the client
     */
    const typesMetadata = input.client.getDatamodel().types;
    this.modelNameToMetadata = arrayToMap(typesMetadata, t => t.name);

    if (input.typegen) {
      console.time("Generating types...");
      codegen(
        typesMetadata,
        input.typegen.entitiesPath,
        input.typegen.clientPath
      );
      console.timeEnd("Generating types...");
    }

    this.cache = input.cache || new SimpleCache();
    this.client = input.client;
    this.baseEntities = input.entities.baseEntities;
    this.customEntities = input.entities.customEntities || [];
    this.entitiesMap = arrayToMap(
      input.entities.baseEntities,
      e => e.modelName
    );
    this.customeEntitiesMap = arrayToMap(this.customEntities, e => e.modelName);
    this.repositoriesCache = {};
  }

  getRepository<Entity extends keyof GetGen<"repositories">>(
    entity: Entity
  ): GetRepositoryFromName<Entity>;
  getRepository<Entity extends new (...args: any[]) => BaseEntity<string>>(
    entity: Entity
  ): GetRepositoryFromEntity<Entity>;
  getRepository<Entity extends any>(entity: Entity): Repository<any, Client> {
    const modelName =
      typeof entity === "string" ? entity : (entity as any).modelName;

    if (
      typeof entity !== "string" &&
      !this.baseEntities.includes(entity as any) &&
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
