import { UserBase } from "../generated";

export class User extends UserBase {
  fullName() {
    return this.firstName + " " + this.lastName;
  }
}
