import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/feed",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/sessions/batch",
  "/api/me/presence",
  "/api/me/tracker-config",
  "/api/users/(.*)/stats",
  "/api/users/(.*)/presence",
  "/api/users/(.*)/heatmap",
  "/api/users/check-username",
]);

const RESERVED_PROFILE_PATHS = new Set([
  "dashboard",
  "settings",
  "onboarding",
  "sign-in",
  "sign-up",
  "api",
  "leaderboard",
  "explore",
  "feed",
  "_next",
]);

function isPublicProfileRoute(req: Request) {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && !RESERVED_PROFILE_PATHS.has(parts[0]);
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req) && !isPublicProfileRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      return session.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
