import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

describe('Card', () => {
  it('is a region its title can name, holding a head, content and a foot', () => {
    render(
      <Card aria-labelledby="welcome">
        <CardHeader>
          <CardTitle id="welcome">Welcome</CardTitle>
          <CardDescription>Start here.</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Foot</CardFooter>
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Welcome' })).toHaveTextContent(
      'WelcomeStart here.BodyFoot',
    );
  });

  it('titles its content with a second-level heading by default', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
      </Card>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Welcome' }),
    ).toBeInTheDocument();
  });

  it('takes the heading level the page gives it', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle as="h1">Introduce yourself</CardTitle>
        </CardHeader>
      </Card>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Introduce yourself' }),
    ).toBeInTheDocument();
  });
});
