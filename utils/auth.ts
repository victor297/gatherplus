export interface JwtPayload {
  exp?: number;
  sub?: number | string;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const isTokenExpiringSoon = (exp?: number, thresholdSeconds = 300) => {
  if (!exp) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return exp - currentTime <= thresholdSeconds;
};

export const toUserId = (sub: JwtPayload["sub"]) => {
  if (typeof sub === "number") {
    return sub;
  }

  if (typeof sub === "string") {
    const parsed = Number(sub);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};
