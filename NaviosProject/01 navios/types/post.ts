export type PostStatus = "draft" | "published" | "expired";

export type PostItem = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  event_date: string;
  author_name: string;
  expire_date: string;
  status: PostStatus;
  user_id: string | null;
  created_at: string;
};

export type PostInput = Omit<PostItem, "id" | "created_at">;
export type PostCreateInput = Omit<PostInput, "user_id">;
