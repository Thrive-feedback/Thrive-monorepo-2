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

  it('quotes every line of a message written over several', () => {
    const post = copy.kudosGiven({
      giverName: 'Ann',
      recipientNames: ['Ben'],
      message: 'Shipped it.\nOver the weekend.',
    });

    // Each line marked, so the link after the quote is not swallowed into it.
    expect(post).toBe(
      [
        '**Ann** gave **Ben** kudos',
        '> Shipped it.',
        '> Over the weekend.',
        'https://thrive.test/home',
      ].join('\n'),
    );
  });

  it('carries the message exactly as it was written, @mentions and all', () => {
    const post = copy.kudosGiven({
      giverName: 'Ann',
      recipientNames: ['Ben'],
      message: '@ben carried the launch #ownership',
    });

    // Verbatim, which is what brain ADR-0045 decided: a slug reaches the channel as the Giver
    // typed it rather than as a name.
    expect(post).toContain('> @ben carried the launch #ownership');
  });
});

describe('a Kudos that names nobody', () => {
  it('is announced as given to the whole team, with no gap where the names go', () => {
    const post = copy.kudosGiven({
      giverName: 'Ann',
      recipientNames: [],
      message: 'Great launch, everyone.',
    });

    expect(post).toContain('**Ann** gave **the whole team** kudos');
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
