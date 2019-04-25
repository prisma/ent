import { UserBaseRepository } from "../generated";

export class UserRepository extends UserBaseRepository {
  findUsersWithPosts() {
    return this.findMany({ select: { posts: true } });
  }
}
