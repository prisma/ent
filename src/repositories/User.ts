import { UserBaseRepository } from "../generated";
import { FindOneRepoOptions } from "../../lib";

export class UserRepository extends UserBaseRepository {
  findUsersWithPosts() {
    return this.findMany({ select: { posts: true } });
  }
}
