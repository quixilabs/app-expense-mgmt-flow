"server only";
import { userUpdateProps } from "@/utils/types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const userUpdate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userUpdateProps) => {
  const cookieStore = cookies();

  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  try {
    const { data, error } = await supabase
      .from("users")
      .update([
        {
          email,
          first_name,
          last_name,
          profile_image_url,
          user_id,
        },
      ])
      .eq("email", email)
      .select();

    if (data) return data;

    if (error) return error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
