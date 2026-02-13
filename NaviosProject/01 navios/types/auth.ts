export type UserRole = "user" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
};
