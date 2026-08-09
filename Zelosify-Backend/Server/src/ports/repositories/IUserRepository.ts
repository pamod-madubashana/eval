import { User } from "../../domain/entities/index.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByExternalId(externalId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>;
  existsByUsernameOrEmail(username: string, email: string): Promise<boolean>;
  create(data: CreateUserDTO): Promise<User>;
  updateTokens(id: string, accessToken: string, refreshToken: string): Promise<void>;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  department: string;
  role: string;
  tenantId: string;
  externalId: string;
  totpSecret: string;
  provider: string;
  creator: string;
}
