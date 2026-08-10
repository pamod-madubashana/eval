import axios from "axios";
import {
  IAuthService,
  AuthTokenResult,
  CreateUserInKeycloakDTO,
  TokenPair,
} from "../../ports/services/IAuthService.js";
import { getAdminToken } from "../../utils/keycloak/getAdminToken.js";
import { getClientSecret } from "../../config/keycloak/keycloak.js";
import { getKeycloakClientSecret } from "../../utils/keycloak/getKeycloakClientSecret.js";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8180/auth";
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "dynamic-client";

export class KeycloakAuthService implements IAuthService {
  async login(email: string, password: string): Promise<AuthTokenResult> {
    const clientSecret = await getKeycloakClientSecret();
    const tokenResponse = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "password",
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        username: email,
        password,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const adminToken = await getAdminToken();
    const clientSecret = await getClientSecret(adminToken);
    await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/logout`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  }

  async getAdminToken(): Promise<string> {
    return getAdminToken();
  }

  async getClientSecret(adminToken: string): Promise<string> {
    return getClientSecret(adminToken);
  }

  async createUser(data: CreateUserInKeycloakDTO): Promise<string> {
    const adminToken = await this.getAdminToken();
    const response = await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users`,
      data,
      { headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" } }
    );
    // Keycloak returns the new user ID in the Location header
    const locationHeader = response.headers.location;
    if (locationHeader) {
      const userId = locationHeader.split("/").pop();
      return userId!;
    }
    throw new Error("Failed to get user ID from Keycloak response");
  }

  async assignRole(keycloakUserId: string, role: string, adminToken: string): Promise<void> {
    try {
      const roleResponse = await axios.get(
        `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/${role}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (roleResponse.data?.id) {
        await axios.post(
          `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${keycloakUserId}/role-mappings/realm`,
          [roleResponse.data],
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      }
    } catch (error) {
      console.error(`Failed to assign role "${role}" to user ${keycloakUserId}:`, error);
    }
  }

  async getTokensFromRefresh(refreshToken: string): Promise<TokenPair> {
    const clientSecret = await getKeycloakClientSecret();
    const tokenResponse = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
    };
  }
}
