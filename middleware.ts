import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { userCreate } from "@/utils/data/userCreate";
import { clerkClient } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/api/(.*)"], // Add public routes here
  async afterAuth(auth, req) {
    // Allow access to the homepage and API routes without authentication
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    // For other routes, redirect to sign-in if not authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (auth.userId) {
      try {
        // Fetch user details from Clerk
        const user = await clerkClient.users.getUser(auth.userId);

        // Create user if they don't exist
        const userData = {
          email: user.emailAddresses[0]?.emailAddress,
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          profile_image_url: user.imageUrl || '',
          user_id: auth.userId,
        };

        console.log("User data from Clerk:", userData);

        if (!userData.email) {
          console.error('No email address found for user');
          return NextResponse.next();
        }

        const result = await userCreate(userData);
        if (result.error) {
          console.error('Error creating/fetching user:', result.error);
        } else if (result.data) {
          console.log('User created or fetched successfully:', result.data);
        } else {
          console.error('Unexpected result from userCreate:', result);
        }
      } catch (error) {
        console.error('Error in afterAuth:', error);
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
