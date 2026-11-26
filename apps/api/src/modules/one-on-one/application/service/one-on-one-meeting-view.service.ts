import { meetingStateOf } from '../../domain/entity/one-on-one-meeting.entity';
import type {
  OneOnOneMeetingProjection,
  OneOnOneMeetingView,
} from '../types/one-on-one-meeting.types';

/** One meeting as either of its two people reads it: as stored, with where it stands. */
export function toMeetingView(
  meeting: OneOnOneMeetingProjection,
): OneOnOneMeetingView {
  return { ...meeting, state: meetingStateOf(meeting) };
}
