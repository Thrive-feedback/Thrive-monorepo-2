import { motion } from 'motion/react';
import { useState } from 'react';
import { Postmark } from '@/components/atoms/postmark';
import { cn } from '@/lib/cn.util';
import {
  POSTMARK_PLACE,
  POSTMARK_PLACE_CLASS_NAME,
} from './postcard-postmark.constant';

/**
 * The postmark coming down on a card as it is sent, dated today. It waits above the card, larger
 * and turned, until the send brings it down, always on the same spot, across the stamp.
 */
export function PostcardPostmark() {
  const [now] = useState(() => new Date().toISOString());

  return (
    <motion.div
      data-postmark
      initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
      style={POSTMARK_PLACE}
      className={cn(POSTMARK_PLACE_CLASS_NAME, 'w-48')}
    >
      <Postmark date={now} />
    </motion.div>
  );
}
