import { client, PrismaClient } from "../prisma/client";
import { EntityManager } from "../lib";
import { UserRepository } from "./repositories/User";
import { entities } from "./generated";
import { join } from "path";

async function findUsersWithPosts(manager: EntityManager<PrismaClient>) {
  const repository = manager.getCustomRepository(UserRepository);
  const users = await repository.findUsersWithPosts();
  const firstUser = users[0];

  console.time("lazy load posts");
  const posts = await firstUser.posts();
  console.timeEnd("lazy load posts");

  console.log({ posts });
  console.log({ secondAccess: await firstUser.posts() });
  console.log({ fullName: firstUser.fullName() });
}

async function testCachingFindOne(manager: EntityManager<PrismaClient>) {
  const repository = manager.getCustomRepository(UserRepository);

  for (let i = 0; i < 100; i++) {
    const user = await repository.findOne({ id: "1" });

    console.log({ firstName: user.firstName });
  }
}

async function load100UsersWithLazyPosts(manager: EntityManager<PrismaClient>) {
  const userRepository = manager.getCustomRepository(UserRepository);

  for (let i = 0; i < 100; i++) {
    let users = await userRepository.findMany();

    for (let j = 0; j < users.length; j++) {
      let user = users[j];
      await user.posts();

      console.log({ loadedTimes: i + 1, postNumber: j + 1 });
    }
  }
}

async function main() {
  const manager = new EntityManager({
    client,
    entities,
    typegen: {
      clientPath: join(__dirname, "../prisma/client.ts"),
      entitiesPath: [join(__dirname, "entities/*.entity.ts")]
    }
  });

  //await load100UsersWithLazyPosts(manager);
  await findUsersWithPosts(manager);
}

main();
