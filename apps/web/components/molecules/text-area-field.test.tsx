import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { HASHTAG_RULE } from '@/lib/feedback/text-tag-rules.constant';
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

  it('offers tags above the box when it is given some to complete', async () => {
    const user = userEvent.setup();
    function Field() {
      const [value, setValue] = useState('');
      return (
        <TextAreaField
          label="Your feedback"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          triggers={[
            {
              rule: HASHTAG_RULE,
              label: 'Workspace Goals',
              tone: 'accent',
              options: [
                {
                  value: 'ownership',
                  label: '#ownership',
                  keywords: ['ownership'],
                },
              ],
            },
          ]}
        />
      );
    }
    render(<Field />);

    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      '#',
    );

    expect(
      screen.getByRole('listbox', { name: 'Workspace Goals' }),
    ).toBeInTheDocument();
  });
});
