import { UserBaseRepository } from "../generated";
import { FindOneRepoOptions } from "../../lib";

export class UserRepository extends UserBaseRepository {
  findUsersWithPosts() {
    return this.findMany({ select: { posts: true } });
  }

  async findOne(opts: FindOneRepoOptions<"User">) {
    const user = this.manager.client.user({ id: "" });

    return this.transformToEntity(user);
  }
}
