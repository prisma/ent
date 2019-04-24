import { PrismaClient } from "../../prisma/client";
import { User as CustomUser } from "./entities/User";
import { Repository, BaseEntity } from "../../lib";
import { UserBase, PostBase } from "../../1/src/generated";

declare global {
  interface PrismaEntity {
    models: {
      User: User;
      Post: Post;
    };
    repositories: {
      User: UserBaseRepository;
      Post: PostBaseRepository;
    };
    selects: {
      User: UserSelect;
      Post: PostSelect;
    };
  }
}

// Entities
interface UserBaseInput {
  id: string;
  firstName: string;
  lastName: string;
  posts: () => Promise<Post[]>;
}

export class User<Model extends string = "User"> extends BaseEntity<Model> {
  static modelName = "User";

  constructor(protected input: UserBaseInput) {
    super();
    this.id = input.id;
    this.firstName = input.firstName;
    this.lastName = input.lastName;
    this.posts = input.posts;
  }

  id: string;
  firstName: string;
  lastName: string;
  posts: () => Promise<Post[]>;
}

interface PostBaseInput {
  id: string;
  title: string;
  body: string;
  author: () => Promise<CustomUser>;
}

export class Post<Model extends string = "Post"> extends BaseEntity<Model> {
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
  Entity extends BaseEntity<"User"> = CustomUser // TODO: Should be defined by configuration
> extends Repository<Entity, PrismaClient> {
  static modelName = "User";
}

export type UserSelect = {
  posts?: boolean;
};
export class PostBaseRepository<
  Entity extends BaseEntity<"Post"> = Post
> extends Repository<Entity, PrismaClient> {
  static modelName = "Post";
}

export type PostSelect = {
  author?: boolean;
};

export const baseEntities = [UserBase, PostBase];
