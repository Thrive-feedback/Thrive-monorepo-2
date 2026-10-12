import { afterEach, describe, expect, it } from 'bun:test';
import type { EmailMessage } from '@app/shared/application/email-sender.port';
import { ResendEmailSender } from './resend-email-sender.adapter';

const FROM_ADDRESS = 'no-reply@send.thrive.example';
const INVITATION_ID = '0199a0f0-0000-7000-8000-0000000000aa';

function anEmail(overrides: Partial<EmailMessage> = {}): EmailMessage {
  return {
    to: 'bee@acme.example',
    idempotencyKey: INVITATION_ID,
    fromName: 'Ann Lee',
    replyTo: 'ann@acme.example',
    subject: 'Ann Lee invited you to Acme on Thrive',
    html: '<p>Join Acme</p>',
    text: 'Join Acme',
    ...overrides,
  };
}

const realFetch = globalThis.fetch;

function stubResend(...statuses: (number | 'unreachable')[]): RequestInit[] {
  const calls: RequestInit[] = [];
  let call = 0;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    calls.push(init);
    const status = statuses[Math.min(call, statuses.length - 1)];
    call += 1;
    if (status === 'unreachable') {
      throw new Error('socket closed');
    }
    return new Response(JSON.stringify({ name: 'validation_error' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return calls;
}

/** The retry delay is removed so a test does not wait it out. */
function senderUnderTest(): ResendEmailSender {
  return new ResendEmailSender(
    're_test_key',
    FROM_ADDRESS,
    async () => undefined,
  );
}

function callAt(calls: RequestInit[], index: number): RequestInit {
  const call = calls[index];
  if (call === undefined) {
    throw new Error(`Resend was not asked a ${index + 1}th time.`);
  }
  return call;
}

function headerOf(call: RequestInit, name: string): string | undefined {
  return Object.fromEntries(Object.entries(call.headers ?? {}))[name];
}

function bodyOf(calls: RequestInit[], index: number): Record<string, string> {
  return JSON.parse(String(callAt(calls, index).body));
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('sending an email through Resend', () => {
  it('reports the message sent when Resend accepts it', async () => {
    const calls = stubResend(200);

    await senderUnderTest().send(anEmail());

    expect(calls).toHaveLength(1);
    expect(bodyOf(calls, 0)).toMatchObject({
      from: '"Ann Lee via Thrive" <no-reply@send.thrive.example>',
      to: 'bee@acme.example',
      reply_to: 'ann@acme.example',
    });
  });

  it('reports the message sent when Resend was briefly unavailable and then accepted it', async () => {
    const calls = stubResend(503, 200);

    await senderUnderTest().send(anEmail());

    expect(calls).toHaveLength(2);
  });

  it('reports the message sent when the connection dropped before an answer arrived', async () => {
    const calls = stubResend('unreachable', 200);

    await senderUnderTest().send(anEmail());

    expect(calls).toHaveLength(2);
  });

  it('names the same email on a retry, so a lost answer cannot deliver it twice', async () => {
    const calls = stubResend(503, 200);

    await senderUnderTest().send(anEmail());

    expect(calls.map((call) => headerOf(call, 'Idempotency-Key'))).toEqual([
      INVITATION_ID,
      INVITATION_ID,
    ]);
  });

  it('reports a message Resend refuses as invalid failed without sending it again', async () => {
    const calls = stubResend(422);

    await expect(senderUnderTest().send(anEmail())).rejects.toThrow();

    expect(calls).toHaveLength(1);
  });

  it('reports the send failed once three attempts have not been accepted', async () => {
    const calls = stubResend(503);

    await expect(senderUnderTest().send(anEmail())).rejects.toThrow();

    expect(calls).toHaveLength(3);
  });

  it('keeps a name carrying a quotation mark inside the sender name', async () => {
    const calls = stubResend(200);

    await senderUnderTest().send(anEmail({ fromName: 'Ann "The Boss" Lee' }));

    expect(bodyOf(calls, 0).from).toBe(
      '"Ann \\"The Boss\\" Lee via Thrive" <no-reply@send.thrive.example>',
    );
  });

  it('keeps a name carrying a line break from starting a header of its own', async () => {
    const calls = stubResend(200);

    await senderUnderTest().send(anEmail({ fromName: 'Ann\r\nBcc: eve@evil' }));

    expect(bodyOf(calls, 0).from).toBe(
      '"Ann Bcc: eve@evil via Thrive" <no-reply@send.thrive.example>',
    );
  });

  it('says which refusal Resend named, so a status alone need not be guessed at', async () => {
    stubResend(400);

    await expect(senderUnderTest().send(anEmail())).rejects.toThrow(
      /validation_error/,
    );
  });
});
