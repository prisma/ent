import { client, PrismaClient } from "../prisma/client";
import { EntityManager, SimpleCache } from "../lib";
import { makeSchema, queryType, objectType } from "nexus";
import { join } from "path";
import { ApolloServer } from "apollo-server";
import { entities } from "./generated";

export interface Context {
  manager: EntityManager<PrismaClient>;
}

const em = new EntityManager({
  client,
  entities,
  cache: new SimpleCache(5 * 1000),
  typegen: {
    clientPath: join(__dirname, "../prisma/client.ts"),
    entitiesPath: [join(__dirname, "./entities/*.entity.ts")]
  }
});

const Query = queryType({
  definition(t) {
    t.field("user", {
      type: "User",
      async resolve(root, args, ctx) {
        const userRepo = await ctx.manager.getRepository("User");

        return userRepo.findOne({ id: "1" });
      }
    });
  }
});

const User = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.string("firstName");
    t.string("lastName");
    t.string("fullName");
    t.list.field("posts", {
      type: "Post"
    });
  }
});

const Post = objectType({
  name: "Post",
  definition(t) {
    t.string("body");
    t.string("title");
  }
});

const schema = makeSchema({
  types: [Query, User, Post],
  outputs: {
    schema: false,
    typegen: join(__dirname, "./nexus.ts")
  },
  typegenAutoConfig: {
    sources: [
      {
        source: __filename,
        alias: "ctx"
      },
      {
        source: join(__dirname, "./generated.ts"),
        alias: "baseEntities"
      },
      {
        source: join(__dirname, "./entities/User.entity.ts"),
        alias: "userEntity"
      }
    ],
    contextType: "ctx.Context"
  }
});

const server = new ApolloServer({
  schema,
  context: () => ({ manager: em })
});

const port = process.env.PORT || 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
