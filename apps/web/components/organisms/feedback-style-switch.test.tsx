import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FeedbackStyleProvider,
  useFeedbackStyle,
} from './feedback-style-provider';
import { FeedbackStyleSwitch } from './feedback-style-switch';

/** The browser's Cookie Store, which jsdom does not have: what the choice is kept in. */
const cookieStore = { set: vi.fn() };

beforeEach(() => {
  cookieStore.set.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('cookieStore', cookieStore);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The cookie the last choice was kept as. */
function keptAs() {
  return cookieStore.set.mock.lastCall?.[0];
}

/** Something else on the page drawn in the chosen style, to see the choice reach it. */
function StyleShown() {
  const { style } = useFeedbackStyle();
  return <p>Drawn as {style}</p>;
}

const plainSwitch = () => screen.getByRole('switch', { name: 'Plain style' });

describe('FeedbackStyleSwitch', () => {
  it('is off for the postcard the server read, named by its label', () => {
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <FeedbackStyleSwitch />
      </FeedbackStyleProvider>,
    );

    expect(plainSwitch()).not.toBeChecked();
  });

  it('is on for the plain style', () => {
    render(
      <FeedbackStyleProvider initialStyle="plain">
        <FeedbackStyleSwitch />
      </FeedbackStyleProvider>,
    );

    expect(plainSwitch()).toBeChecked();
  });

  it('changes every card at once and keeps the choice, from the switch or its label', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <FeedbackStyleSwitch onChoose={onChoose} />
        <StyleShown />
      </FeedbackStyleProvider>,
    );

    await user.click(screen.getByText('Plain style'));

    expect(screen.getByText('Drawn as plain')).toBeInTheDocument();
    expect(plainSwitch()).toBeChecked();
    expect(onChoose).toHaveBeenCalledWith('plain');
    expect(keptAs()).toMatchObject({
      name: 'thrive.feedback-style',
      value: 'plain',
      path: '/',
      sameSite: 'lax',
    });

    await user.click(plainSwitch());

    expect(screen.getByText('Drawn as postcard')).toBeInTheDocument();
    expect(keptAs()).toMatchObject({ value: 'postcard' });
  });

  it('turns from the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <FeedbackStyleSwitch />
      </FeedbackStyleProvider>,
    );

    plainSwitch().focus();
    await user.keyboard(' ');

    expect(plainSwitch()).toBeChecked();
  });

  it('keeps the new style on the page when keeping it fails', async () => {
    const user = userEvent.setup();
    cookieStore.set.mockRejectedValue(new Error('blocked'));
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <FeedbackStyleSwitch />
        <StyleShown />
      </FeedbackStyleProvider>,
    );

    await user.click(plainSwitch());

    expect(screen.getByText('Drawn as plain')).toBeInTheDocument();
  });

  it('keeps the new style on the page where the browser has no Cookie Store', async () => {
    const user = userEvent.setup();
    vi.unstubAllGlobals();
    render(
      <FeedbackStyleProvider initialStyle="postcard">
        <FeedbackStyleSwitch />
        <StyleShown />
      </FeedbackStyleProvider>,
    );

    await user.click(plainSwitch());

    expect(screen.getByText('Drawn as plain')).toBeInTheDocument();
  });

  it('is not offered where nobody is signed in to choose, and the postcard holds', () => {
    render(
      <>
        <FeedbackStyleSwitch />
        <StyleShown />
      </>,
    );

    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByText('Drawn as postcard')).toBeInTheDocument();
  });
});
