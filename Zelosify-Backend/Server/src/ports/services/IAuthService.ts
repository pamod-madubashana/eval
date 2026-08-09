export interface IAuthService {
  login(email: string, password: string): Promise<AuthTokenResult>;
  logout(refreshToken: string): Promise<void>;
  getAdminToken(): Promise<string>;
  getClientSecret(adminToken: string): Promise<string>;
  createUser(data: CreateUserInKeycloakDTO): Promise<string>;
  assignRole(keycloakUserId: string, role: string, adminToken: string): Promise<void>;
  getTokensFromRefresh(refreshToken: string): Promise<TokenPair>;
}

export interface AuthTokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface CreateUserInKeycloakDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  credentials: Array<{ type: string; value: string; temporary: boolean }>;
}
