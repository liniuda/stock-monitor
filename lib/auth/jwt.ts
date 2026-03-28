import { SignJWT, jwtVerify } from "jose";
import { AuthPayload, JWT_COOKIE_NAME, JWT_EXPIRY } from "./types";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "stock-monitor-default-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

export function authCookieOptions(token: string) {
  return {
    name: JWT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

export function clearCookieOptions() {
  return {
    name: JWT_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
