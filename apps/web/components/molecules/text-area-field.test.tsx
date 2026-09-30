import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextAreaField } from './text-area-field';

describe('TextAreaField', () => {
  it('is named, described, and announces its error the same way', () => {
    render(
      <TextAreaField
        label="Feedback"
        errorMessage="Tell them what went well."
      />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Feedback' });

    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription('Tell them what went well.');
  });
});
