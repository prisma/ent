import { BaseEntity } from "./entity";

export class User<Model extends string = "User"> extends BaseEntity<Model> {
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

interface UserInput {
  id: string;
  firstName: string;
  lastName: string;
  posts: () => Promise<Post[]>;
}

export class Post<Model extends string = "Post"> extends BaseEntity<Model> {
  static modelName = "Post";

  constructor(protected input: PostInput) {
    super();
    this.id = input.id;
    this.title = input.title;
    this.body = input.body;
    this.author = input.author;
  }

  id: string;
  title: string;
  body: string;
  author: () => Promise<User>;
}

interface PostInput {
  id: string;
  title: string;
  body: string;
  author: () => Promise<User>;
}
