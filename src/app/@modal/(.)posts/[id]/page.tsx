import { PostModal } from "@/features/feed/PostModal";
import { PostDetail } from "@/features/feed/PostDetail";

type Props = { params: Promise<{ id: string }> };

export default async function InterceptedPostModal({ params }: Props) {
  const { id } = await params;
  return (
    <PostModal>
      <PostDetail id={id} />
    </PostModal>
  );
}
