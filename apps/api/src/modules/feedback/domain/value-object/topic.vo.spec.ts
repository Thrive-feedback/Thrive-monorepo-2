import { describe, expect, it } from 'bun:test';
import { TopicEmptyError, TopicTooLongError } from '../feedback-request.errors';
import { Topic } from './topic.vo';

describe('a Topic', () => {
  it('keeps what the Requester wrote, with surrounding and repeated spaces collapsed', () => {
    expect(Topic.of('  my   presentation skills ').toString()).toBe(
      'my presentation skills',
    );
  });

  it('is refused when it is only spaces, because that says nothing', () => {
    expect(() => Topic.of('   ')).toThrow(TopicEmptyError);
  });

  it('is refused when it is longer than a short text', () => {
    expect(() => Topic.of('a'.repeat(Topic.MAX_LENGTH + 1))).toThrow(
      TopicTooLongError,
    );
  });

  it('counts a Thai cluster as the one character a reader sees', () => {
    const cluster = 'ที่';

    expect(() => Topic.of(cluster.repeat(Topic.MAX_LENGTH))).not.toThrow();
  });
});
