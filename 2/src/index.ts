import { client, PrismaClient } from "../../prisma/client";
import { EntityManager } from "../../lib";
import { User as UserEntity } from "./entities";
import { makeSchema, queryType, objectType } from "nexus";
import { join } from "path";
import { ApolloServer } from "apollo-server";
import { baseEntities } from "./generated";

export interface Context {
  manager: EntityManager<PrismaClient>;
}

async function main() {
  const em = new EntityManager({
    client,
    baseEntities,
    customEntities: [UserEntity]
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
          source: join(__dirname, "./index.ts"),
          alias: "ctx"
        },
        {
          source: join(__dirname, "./entities/User.ts"),
          alias: "entities"
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
}

main();
