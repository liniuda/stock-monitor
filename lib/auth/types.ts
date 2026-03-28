export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface AuthResponse {
  id: string;
  username: string;
}

export const JWT_COOKIE_NAME = "auth-token";
export const JWT_EXPIRY = "7d";
