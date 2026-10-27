import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import { ChannelCopyService } from './channel-copy.service';

const copy = new ChannelCopyService(new WebConfig('https://thrive.test'));

describe('what a Workspace channel is told about Feedback', () => {
  it('names the Giver and the Receiver, and links', () => {
    const post = copy.feedbackPublished({
      giverName: 'Ann',
      receiverNames: ['Ben'],
      feedbackId: 'feedback-1',
    });

    expect(post).toBe(
      [
        '**Ann** gave **Ben** feedback',
        'https://thrive.test/home?feedback=feedback-1',
      ].join('\n'),
    );
  });

  it('names every Receiver when Feedback was written to several', () => {
    const post = copy.feedbackPublished({
      giverName: 'Ann',
      receiverNames: ['Ben', 'Cara', 'Dan'],
      feedbackId: 'feedback-1',
    });

    expect(post).toContain('**Ann** gave **Ben, Cara and Dan** feedback');
  });

  it('says somebody for a person who has not introduced themselves', () => {
    const post = copy.feedbackPublished({
      giverName: null,
      receiverNames: [null],
      feedbackId: 'feedback-1',
    });

    expect(post).toContain('**Someone** gave **Someone** feedback');
  });
});

describe('what a Workspace channel is told about Kudos', () => {
  it('carries the message, because a Kudos has no Visibility (brain ADR-0045)', () => {
    const post = copy.kudosGiven({
      giverName: 'Ann',
      recipientNames: ['Ben'],
      message: 'Carried the launch without being asked.',
    });

    expect(post).toBe(
      [
        '**Ann** gave **Ben** kudos',
        '> Carried the launch without being asked.',
        'https://thrive.test/home',
      ].join('\n'),
    );
  });

  it('keeps a message with newlines on one quoted line', () => {
    const post = copy.kudosGiven({
      giverName: 'Ann',
      recipientNames: ['Ben'],
      message: 'Shipped it.\n\nOver the weekend.  ',
    });

    expect(post).toContain('> Shipped it. Over the weekend.');
  });
});

describe('the difference between the two, which is the point', () => {
  it('never puts the words of Feedback in a channel (brain ADR-0040)', () => {
    // A channel is read by whoever is in that server, which is not the same set of people as
    // the Workspace. The copy service is never handed the Feedback message to begin with, and
    // this is the test that says so if somebody adds it.
    const post = copy.feedbackPublished({
      giverName: 'Ann',
      receiverNames: ['Ben'],
      feedbackId: 'feedback-1',
    });

    expect(post.split('\n')).toHaveLength(2);
    expect(post).not.toContain('>');
  });
});
