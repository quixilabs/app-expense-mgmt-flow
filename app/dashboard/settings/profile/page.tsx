"use client"

import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <UserProfile />
    </div>
  );
}
