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
      Comment: Comment;
    }
    repositories: {
      User: UserBaseRepository;
      Post: PostBaseRepository;
      Comment: CommentBaseRepository;
    }
    selects: {
      User: UserSelect;
      Post: PostSelect;
      Comment: CommentSelect;
    }
    baseEntities: User | Post | Comment
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
    this.veryLongString = input.veryLongString;
    this.shortString = input.shortString;
    this.posts = input.posts;
  }

  id: string;
  firstName: string;
  lastName: string;
  veryLongString: string;
  shortString: string;
  posts: () => Promise<Post[]>;
}

export interface UserInput {
  id: string;
  firstName: string;
  lastName: string;
  veryLongString: string;
  shortString: string;
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
    this.author = input.author;
    this.comments = input.comments;
  }

  id: string;
  title: string;
  body: string;
  author: () => Promise<ExtendedUser>;
  comments: () => Promise<Comment[]>;
}

export interface PostInput {
  id: string;
  title: string;
  body: string;
  author: () => Promise<ExtendedUser>;
  comments: () => Promise<Comment[]>;
}

export interface PostSelect {
  author?: boolean | UserSelect;
  comments?: boolean | CommentSelect
}

export class Comment extends BaseEntity<"Comment"> {
  static modelName = "Comment";

  constructor(protected input: CommentInput) {
    super();

    this.id = input.id;
    this.body = input.body;
    this.author = input.author;
  }

  id: string;
  body: string;
  author: () => Promise<ExtendedUser>;
}

export interface CommentInput {
  id: string;
  body: string;
  author: () => Promise<ExtendedUser>;
}

export interface CommentSelect {
  author?: boolean | UserSelect
}

export class UserBaseRepository extends Repository<ExtendedUser, PrismaClient> {
  static modelName = "User";
}

export class PostBaseRepository extends Repository<Post, PrismaClient> {
  static modelName = "Post";
}

export class CommentBaseRepository extends Repository<Comment, PrismaClient> {
  static modelName = "Comment";
}

export const entities: {
  baseEntities: BaseEntities
  customEntities: CustomEntities
} = {
  baseEntities: [User, Post, Comment],
  customEntities: [
    require("./entities/User.entity").User
  ]
}
