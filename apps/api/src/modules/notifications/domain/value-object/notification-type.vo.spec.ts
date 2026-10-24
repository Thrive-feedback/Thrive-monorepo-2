import { describe, expect, it } from 'bun:test';
import { NotificationTypeNotSupportedError } from '../notifications.errors';
import { NotificationType } from './notification-type.vo';

describe('the kind of thing somebody is told about', () => {
  it('accepts each of the four things Thrive tells people about', () => {
    expect(NotificationType.of('ASK_RECEIVED').toString()).toBe('ASK_RECEIVED');
    expect(NotificationType.of('ASK_ANSWERED').toString()).toBe('ASK_ANSWERED');
    expect(NotificationType.of('FEEDBACK_RECEIVED').toString()).toBe(
      'FEEDBACK_RECEIVED',
    );
    expect(NotificationType.of('FEEDBACK_SHARED').toString()).toBe(
      'FEEDBACK_SHARED',
    );
  });

  it('refuses a kind of thing it has no sentence for', () => {
    expect(() => NotificationType.of('REACTION_ADDED')).toThrow(
      NotificationTypeNotSupportedError,
    );
  });

  it('refuses a value that differs only in case', () => {
    // The wire value never changes once shipped, so a near miss is a different value and not a
    // spelling to be forgiven.
    expect(() => NotificationType.of('ask_received')).toThrow(
      NotificationTypeNotSupportedError,
    );
  });
});
