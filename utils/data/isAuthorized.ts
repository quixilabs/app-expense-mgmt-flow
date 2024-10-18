"server only";

import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const isAuthorized = async (
  userId: string
): Promise<{ authorized: boolean; message: string }> => {

  const result = await clerkClient.users.getUser(userId);

  if (!result) {
    return {
      authorized: false,
      message: "User not found",
    };
  }

  const cookieStore = cookies();

  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error?.code)
      return {
        authorized: false,
        message: error.message,
      };

    if (data && data[0].status === "active") {
      return {
        authorized: true,
        message: "User is subscribed",
      };
    }

    return {
      authorized: false,
      message: "User is not subscribed",
    };
  } catch (error: any) {
    return {
      authorized: false,
      message: error.message,
    };
  }
};
