import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Account-scoped routes — auth required. Everything else is public so the
// surveillance dashboard, sources, API, RSS, sitemap remain free to read.
const isProtected = createRouteMatcher([
  "/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const { userId } = await auth();
    if (!userId) {
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next internals + static files
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
