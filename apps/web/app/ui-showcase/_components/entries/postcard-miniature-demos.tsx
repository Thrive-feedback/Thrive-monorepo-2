'use client';

import {
  PostcardMiniature,
  type PostcardMiniatureProps,
} from '@/components/organisms/postcard-miniature/postcard-miniature';

/** The miniature draws stickers, which only a client can, so the server entry shows it through this. */
export function PostcardMiniatureDemo(props: PostcardMiniatureProps) {
  return <PostcardMiniature {...props} />;
}
