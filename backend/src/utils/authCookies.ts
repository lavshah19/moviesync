import type { Request } from "express";

// ponytail: parses the Cookie header directly, swap for cookie-parser if more routes need cookies
export const getAuthCookies = (req: Request) => {
  const cookies: Record<string, string> = {};
  for (const pair of (req.headers.cookie ?? "").split(";")) {
    const i = pair.indexOf("=");
    if (i === -1) continue;
    try {
      cookies[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
    } catch {
      // malformed %-encoding: skip the cookie rather than 500 the request
    }
  }
  return {
    accessToken: cookies.accessToken as string | undefined,
    refreshToken: cookies.refreshToken as string | undefined,
  };
};
