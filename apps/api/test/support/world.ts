import assert from 'node:assert/strict';
import { CORRELATION_ID_HEADER } from '@app/shared/presentation/correlation-id.middleware';
import {
  defineParameterType,
  type IWorldOptions,
  setWorldConstructor,
  World,
} from '@cucumber/cucumber';
import { v7 as uuidv7 } from 'uuid';
import { harness } from './harness';
import type {
  SignedInAccount,
  WorkspaceFixtures,
} from './workspace.integration-fixtures';

/** A person in a scenario, by the first name the feature file gives them. */
defineParameterType({ name: 'person', regexp: /[A-Z][a-z]+/ });

export interface ApiResponse {
  readonly status: number;
  // Each step reads the fields it needs; the contract's own tests check the shapes.
  // biome-ignore lint/suspicious/noExplicitAny: a response body as JSON
  readonly body: any;
}

type HttpMethod = 'GET' | 'POST' | 'DELETE';

export interface FeedbackRequestSent {
  readonly id: string;
  readonly workspaceId: string;
}

/**
 * One scenario's state: who is in it, what they made, and the last answer the API gave
 * (`BE_13` R5). Cucumber builds a new one for every scenario.
 */
export class ThriveWorld extends World {
  fixtures!: WorkspaceFixtures;
  lastResponse?: ApiResponse;
  feedbackRequest?: FeedbackRequestSent;
  private readonly people = new Map<string, SignedInAccount>();
  /** The Ask each person has open, so answering it twice does not need it to still be waiting. */
  private readonly asksOnScreen = new Map<string, string>();
  /** The Workspace each person belongs to, once they belong to one. */
  private readonly workspaces = new Map<string, string>();
  /** Invitations written straight to the store, by who they were sent to; no email carries them. */
  private readonly storedInvitations = new Map<string, string>();

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * Signs `name` in. Google cannot be driven from a test, so the session is written the way
   * Better Auth writes one, and the cookie is the one a browser would hold (`BE_13` R3).
   */
  async signIn(name: string): Promise<SignedInAccount> {
    const account = await this.fixtures.aSignedInAccount(name.toLowerCase());
    this.people.set(name, account);
    return account;
  }

  /** Remembers the Ask `name` is looking at, the way their screen holds the id. */
  opened(name: string, askId: string): void {
    this.asksOnScreen.set(name, askId);
  }

  askOnScreen(name: string): string | undefined {
    return this.asksOnScreen.get(name);
  }

  person(name: string): SignedInAccount {
    const account = this.people.get(name);
    assert.ok(
      account,
      `${name} is not in this scenario yet; sign them in first.`,
    );
    return account;
  }

  isSignedIn(name: string): boolean {
    return this.people.has(name);
  }

  joined(name: string, workspaceId: string): void {
    this.workspaces.set(name, workspaceId);
  }

  workspaceOf(name: string): string {
    const workspaceId = this.workspaces.get(name);
    assert.ok(
      workspaceId,
      `${name} does not belong to a Workspace in this scenario.`,
    );
    return workspaceId;
  }

  invitationStoredFor(invitee: string, invitationId: string): void {
    this.storedInvitations.set(invitee, invitationId);
  }

  storedInvitationTo(invitee: string): string | undefined {
    return this.storedInvitations.get(invitee);
  }

  /** Calls the API as `name` would from the web — their session cookie, a correlation id. */
  as(
    name: string,
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse> {
    return this.call(this.person(name).credential, method, path, body);
  }

  /** Calls the API as a browser holding no session would — a visitor, or someone signed out. */
  anonymously(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse> {
    return this.call(undefined, method, path, body);
  }

  private async call(
    credential: string | undefined,
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = {
      [CORRELATION_ID_HEADER]: `scenario-${uuidv7()}`,
    };
    if (credential !== undefined) {
      headers.cookie = credential;
    }
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
    }
    const response = await fetch(`${harness().baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    this.lastResponse = {
      status: response.status,
      body: text === '' ? null : JSON.parse(text),
    };
    return this.lastResponse;
  }

  /** For a given: the call has to have worked, or the scenario is not testing what it says. */
  succeeded(response: ApiResponse, what: string): ApiResponse {
    assert.ok(
      response.status >= 200 && response.status < 300,
      `${what} failed: ${response.status} ${JSON.stringify(response.body)}`,
    );
    return response;
  }

  /** For a refusal: the contract is the outcome, so the code from the catalogue is asserted. */
  refusedWith(code: string): void {
    assert.ok(this.lastResponse, 'Nothing was asked of the API.');
    assert.equal(
      this.lastResponse.body?.error?.code,
      code,
      `Expected ${code}, got ${this.lastResponse.status} ${JSON.stringify(this.lastResponse.body)}`,
    );
  }
}

setWorldConstructor(ThriveWorld);
