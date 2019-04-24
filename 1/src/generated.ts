import { PrismaClient } from "../../prisma/client";
import { User } from "./entities/User";
import { Repository, BaseEntity } from "../../lib";

// declare global {
//   interface PrismaEntity {
//     models: {
//       User: UserBase;
//       Post: PostBase;
//     };
//     repositories: {
//       User: UserBaseRepository;
//       Post: PostBaseRepository;
//     };
//     selects: {
//       User: UserSelect;
//       Post: PostSelect;
//     };
//   }
// }

// Entities
interface UserBaseInput {
  firstName: string;
  lastName: string;
  posts: () => Promise<PostBase[]>;
}

export class UserBase<Model extends string = "User"> extends BaseEntity<Model> {
  static modelName = "User";

  constructor(protected input: UserBaseInput) {
    super();
    this.firstName = input.firstName;
    this.lastName = input.lastName;
    this.posts = input.posts;
  }

  firstName: string;
  lastName: string;
  posts: () => Promise<PostBase[]>;
}

interface PostBaseInput {
  id: string;
  title: string;
  body: string;
}

export class PostBase<Model extends string = "Post"> extends BaseEntity<Model> {
  static modelName = "Post";

  constructor(input: PostBaseInput) {
    super();

    this.id = input.id;
    this.title = input.title;
    this.body = input.body;
  }

  id: string;
  title: string;
  body: string;
}

// Repositories

export class UserBaseRepository<
  Entity extends BaseEntity<"User"> = User // TODO: Should be defined by configuration
> extends Repository<Entity, PrismaClient> {
  static modelName = "User";
}

export type UserSelect = {
  posts?: boolean;
};

export class PostRepository<
  Entity extends BaseEntity<"Post"> = PostBase
> extends Repository<Entity, PrismaClient> {
  static modelName = "Post";
}

export type PostSelect = {};
