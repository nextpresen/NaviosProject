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
  created_at: string;
};

export type PostInput = Omit<PostItem, "id" | "created_at">;
