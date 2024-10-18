"server only"

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { userCreateProps } from "@/utils/types";
import { v4 as uuidv4 } from 'uuid';

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userCreateProps) => {
  const cookieStore = cookies();

  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });

  try {
    // First, check if the user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking for existing user:", fetchError);
      return { error: fetchError };
    }

    if (existingUser) {
      console.log("User already exists:", existingUser);
      return { data: existingUser };
    }

    // If user doesn't exist, create a new one
    if (!email) {
      console.error("Email is required for user creation");
      return { error: new Error("Email is required for user creation") };
    }

    const newUser = {
      id: uuidv4(),
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      profile_image_url: profile_image_url || '',
      user_id,
    };

    const { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return { error };
    }

    console.log("User created successfully:", data);
    return { data };
  } catch (error: any) {
    console.error("Unexpected error in userCreate:", error);
    return { error };
  }
};
