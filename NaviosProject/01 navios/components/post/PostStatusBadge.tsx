import { Badge } from "@/components/ui";
import type { PostStatus } from "@/types/post";

type Props = {
  status: PostStatus;
};

const statusConfig: Record<PostStatus, { label: string; variant: "gray" | "green" | "red" }> = {
  draft: { label: "下書き", variant: "gray" },
  published: { label: "公開中", variant: "green" },
  expired: { label: "掲載終了", variant: "red" },
};

export function PostStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
