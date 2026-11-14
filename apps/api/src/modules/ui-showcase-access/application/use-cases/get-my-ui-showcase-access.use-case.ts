import { UiShowcaseConfig } from '@app/config/configuration';
import { Injectable } from '@nestjs/common';

export interface GetMyUiShowcaseAccessInput {
  /** The address the caller signed in with, lower-cased as Better Auth stores every Account's. */
  readonly email: string;
}

/** Whether the caller may open the UI showcase, and nothing about who else may. */
export interface UiShowcaseAccess {
  readonly isAllowed: boolean;
}

/**
 * A query: is the signed-in caller on the deployment's list (ADR 0088). Both sides arrive in lower
 * case — the list from the config layer, the caller's address from Better Auth — so the match is
 * exact and nothing here normalizes again (`BE_08` R8).
 */
@Injectable()
export class GetMyUiShowcaseAccessUseCase {
  constructor(private readonly uiShowcaseConfig: UiShowcaseConfig) {}

  execute(input: GetMyUiShowcaseAccessInput): UiShowcaseAccess {
    return {
      isAllowed: this.uiShowcaseConfig.allowedEmails.has(input.email),
    };
  }
}
