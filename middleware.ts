import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/"],
  afterAuth(auth, req, evt) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Redirect logged in users to dashboard if they try to access the home page
    if (auth.userId && req.nextUrl.pathname === "/") {
      return Response.redirect(new URL('/dashboard', req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
