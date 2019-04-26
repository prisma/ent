# ent

An entity layer for Prisma that uses the DataMapper pattern.

> **Warning**: This is more than WIP and cannot be used at all yet.



## Motivation

So far, the only data-access layer possible with Prisma has been the `prisma-client`. While this is certainly the most flexible/performant layer (which can be seen as a query-builder in most other ORMs), we thought there was one missing piece for Prisma to compete even better with other ORMs in the landscape (such as TypeORM, Doctrine, ActiveRecord etc..): **Entities**.

While you can certainly already build your own entity layer with the `prisma-client` today, we think there's room for another abstraction that would help you build that layer through code-generation.



## Entities ?

Entities are domain models which you can use across your application to do business logic using consistent and predictable "data objects".



## What does the architecture look like?

Datamodel -> Entity -> Repository -> Service (optional) -> API Layer

- **Datamodel**:                 This is the traditional prisma datamodel defined in the `datamodel.prisma`

- **Entity**:                           Classes that maps to your datamodel types

- **Repository**:                  Layer reponsible for fetching data and hydrating your entities

- **Service: (optional)**:    Layer that aggregate several repositories and handle business logic

- **API Layer (optional)**: Your traditional api layer, whether it's rest, graphql etc..

  

## What does an entity look like ?

Given the following prisma datamodel:

```graphql
type User {
  id: ID! @id
  firstName: String!
  lastName: String!
  posts: [Post]
}

type Post {
  id: ID! @id
  body: String!
}
```

The following entities are derived/generated:

```ts
//generated.ts

export class User extends BaseEntity<"User"> {
  static modelName = "User";
  
  id: string;
  firstName: string;
  lastName: string;
  posts: () => Promise<ExtendedPost[]>;

  constructor(protected input: UserInput) {
    super(input);
  }
}

export class Post extends BaseEntity<"Post"> {
  static modelName = "Post";

  id: string;
  body: string;
  
  constructor(protected input: PostInput) {
    super(input);
  }
}
```



As you may deduce, entities follow two rules:

- Scalars are **fetched by default**
- Relations are **lazy by default**. It means they're fetched only when accessing the property. (*More on that later*)

Entities are "dumb" class which only responsability is to hold data. In most ORMs, entities are used to actually map your datamodel.
With Prisma, because the datamodel is defined declaratively in the `datamodel.prisma` file, we do it the other way around and generate base entities for you from it.

These base entities can then be extended to add computed fields:

```ts
// ./entities/User.ts
import { User as UserBase } from './generated'

export class User extends UserBase {
  fullName() {
    return this.firstName + ' ' + this.lastName;
  }
}
```



## What does a repository look like ?



Given the same datamodel above, the following base repositories will be generated:

```typescript
export class UserBaseRepository extends Repository<User, PrismaClient> {
  static modelName = "User";
}

export class PostBaseRepository extends Repository<Post, PrismaClient> {
  static modelName = "Post";
}
```



As said earlier, repositories' responsabilities is to to fetch data + hydrate your entities (transform the javascript object returned from the `prisma-client` to the actual entity classes).



By default, repositories have the following methods (**the write part is not yet done**):

```typescript
// This is a schematic representation of the actual repository class
class Repository<Entity> {
    // Read
    findOne(args: FindOneOpts<Entity>): Promise<Entity>
    findMany(args: FindManyOpts<Entity>): Primise<Entity[]>
        
    // Write (to be done)
    create(args: CreateOpts:<Entity>): Promise<Entity>
    update(args: UpdateOpts<Entity>): Promise<Entity>
    delete(args: DeleteOpts<Entity>): Promise<Entity>
}
```



Just like entities, repositories can be extended as well to add more specific methods:

```typescript
// ./repositories/User.ts
import { UserBaseRepository } from './generated.ts'

export const class UserRepository extends UserBaseRepository {
  findUserWithPosts(id: string) {
    return this.findOne({ id, prefetch: { posts: true } })
  }
  
  findUsersWithPostsAndAuthors() {
    return this.findMany({
      prefetch: {
        posts: { author: true }
      }
    })
  }
}
```



As you may have noticed, `findOne` (and `findMany`) have a `prefetch` option. This allow you to prefetch (or eager-load) relations in a fully type-safe way. Later, when doing `await user.posts()`, the promise will already be resolved and thus return you the value instantly.



## How do I use repositories ?

Repositories are never constructed manually. Instead you use an `EntityManager` to provide you instances of your repositories.

```typescript
import { EntityManager } from 'prisma-ent'
import { prisma } from 'prisma-client'
import { entities } from './generated' // generated file also export the entities for convenience

const em = new EntityManager({
  client: prisma,
  entities,
  typegen: {
    customEntitiesPath: [
      path.join(__dirname, './entities/*.ts')
    ]
  }
})

const userRepository = em.getRepository("User") // or em.getRepository(UserBaseRepository)
const user = userRepository.findOne({ id: 1 })
const userPost = await user.posts()
```



> Note: While the EntityManager is currently the highest abstraction, there should be another one on top of it later. (something like `const pe = new PrismaEntity()`)



## What now ?

This is very early and WIP. Feel free to check out the source code and see how it looks like in `src/*.ts`.

The [prisma-client V2](https://github.com/prisma/rfcs/blob/new-ts-client-rfc/text/0000-new-ts-client.md) first need to be released in order for this to work.

Any feedback for design decisions though issues are well appreciated. Keep in mind though that a lot might change in the coming weeks.

