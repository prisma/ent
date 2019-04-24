import { FindOneRepoOptions } from "../lib/types";
import { ISDL } from "prisma-datamodel";
import { readPrismaYml, findDatamodelAndComputeSchema } from "./read-datamodel";

const postsData = [
  { id: "1", title: "title_1", body: "body_1", user_id: "1" },
  { id: "2", title: "title_2", body: "body_2", user_id: "1" },
  { id: "3", title: "title_3", body: "body_3", user_id: "2" },
  { id: "4", title: "title_4", body: "body_4", user_id: "2" },
  { id: "5", title: "title_5", body: "body_5", user_id: "3" }
];

const usersData = [
  { id: "1", firstName: "firstName_1", lastName: "lastName_1" },
  { id: "2", firstName: "firstName_2", lastName: "lastName_2" },
  { id: "3", firstName: "firstName_3", lastName: "lastName_3" }
];

interface User {
  id: string;
  firstName: string;
  lastName: string;
  posts?: Post[];
}

interface Post {
  id: string;
  title: string;
  body: string;
}

type WhereInput = {
  user: { id: string };
};

export type PrismaClient = {
  user(opts: {
    id: string;
    select?: FindOneRepoOptions<"User">["select"];
  }): Promise<User>;
  users(opts: {
    select?: FindOneRepoOptions<"User">["select"];
  }): Promise<User[]>;
  posts(opts: { where?: WhereInput }): Promise<Post[]>;
  getDatamodel(): ISDL;
};

export const client: PrismaClient = {
  async user(opts: {
    id: string;
    select?: FindOneRepoOptions<"User">["select"];
    where?: WhereInput;
  }) {
    await stall(2000);
    let result: any = usersData.find(u => u.id === opts.id);

    if (opts.select && opts.select.posts) {
      result["posts"] = postsData.find(p => p.user_id === result.id);
    }

    return result;
  },
  async users(opts: {
    select?: FindOneRepoOptions<"User">["select"];
    where?: WhereInput;
  }) {
    await stall(2000);
    let result = usersData;

    if (opts.select && opts.select.posts) {
      result = result.map(r => {
        r["posts"] = postsData.find(p => p.user_id === r.id);

        return r;
      });
    }

    return result;
  },
  async posts(opts: { where?: WhereInput }) {
    await stall(2000);

    if (opts.where) {
      return postsData.filter(p => p.user_id === opts.where.user.id);
    }

    return postsData;
  },
  getDatamodel() {
    const prisma = readPrismaYml();

    /**
     * Should be stored in the base entities during code-generation step or read from the client
     */
    return findDatamodelAndComputeSchema(prisma.configPath, prisma.config)
      .datamodel;
  }
};

function stall(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
