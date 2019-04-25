  import {
    Repository,
    BaseEntity,
    BaseEntities,
    CustomEntities
  } from "../lib";
  import { PrismaClient } from "../prisma/client"
  import { User as ExtendedUser } from "./entities/User.entity"

declare global {
  interface PrismaEntity {
    models: {
      User: User;
      Post: Post;
    }
    repositories: {
      User: UserBaseRepository;
      Post: PostBaseRepository;
    }
    selects: {
      User: UserSelect;
      Post: PostSelect;
    }
    baseEntities: User | Post
    customEntities: ExtendedUser
  }
}

export class User extends BaseEntity<"User"> {
  static modelName = "User";

  constructor(protected input: UserInput) {
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

export interface UserInput {
  id: string;
  firstName: string;
  lastName: string;
  posts: () => Promise<Post[]>;
}

export interface UserSelect {
  posts?: boolean | PostSelect
}

export class Post extends BaseEntity<"Post"> {
  static modelName = "Post";

  constructor(protected input: PostInput) {
    super();

    this.id = input.id;
    this.title = input.title;
    this.body = input.body;
  }

  id: string;
  title: string;
  body: string;
}

export interface PostInput {
  id: string;
  title: string;
  body: string;
}

export interface PostSelect {

}

export class UserBaseRepository extends Repository<ExtendedUser, PrismaClient> {
  static modelName = "User";
}

export class PostBaseRepository extends Repository<Post, PrismaClient> {
  static modelName = "Post";
}

export const entities: {
  baseEntities: BaseEntities
  customEntities: CustomEntities
} = {
  baseEntities: [User, Post],
  customEntities: [
    require("./entities/User.entity").User
  ]
}
