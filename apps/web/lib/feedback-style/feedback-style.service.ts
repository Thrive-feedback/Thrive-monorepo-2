import { cookies } from 'next/headers';
import {
  FEEDBACK_STYLE_COOKIE,
  type FeedbackStyle,
  parseFeedbackStyle,
} from './feedback-style.constant';

/** The look this person chose for Feedback, as their browser sent it, or the default. */
export async function readFeedbackStyle(): Promise<FeedbackStyle> {
  const cookieStore = await cookies();
  return parseFeedbackStyle(cookieStore.get(FEEDBACK_STYLE_COOKIE)?.value);
}
