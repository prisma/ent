import { User as UserBaseEntity } from "../generated";

export class User extends UserBaseEntity {
  fullName() {
    return this.firstName + " " + this.lastName;
  }
}
