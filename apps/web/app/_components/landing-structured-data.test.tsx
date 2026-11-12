import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LANDING_COPY } from './landing/landing-copy.constant';
import { LandingStructuredData } from './landing-structured-data';

function readJsonLd(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.textContent ?? 'null');
}

describe('LandingStructuredData', () => {
  it('says what the page is: the site, who publishes it and the web app, on the configured address', () => {
    const { container } = render(<LandingStructuredData />);
    const data = readJsonLd(container);

    expect(data['@context']).toBe('https://schema.org');
    const types = data['@graph'].map(
      (node: { '@type': string }) => node['@type'],
    );
    expect(types).toEqual(['Organization', 'WebSite', 'WebApplication']);
    for (const node of data['@graph']) {
      expect(node.name).toBe('Thrive');
      expect(node.url).toBe('https://thrive.test/');
    }
  });

  it('describes the app in the words the page’s metadata uses', () => {
    const { container } = render(<LandingStructuredData />);
    const app = readJsonLd(container)['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'WebApplication',
    );

    expect(app.description).toBe(LANDING_COPY.meta.description);
  });

  it('claims no price, rating, review or count the page does not show', () => {
    const { container } = render(<LandingStructuredData />);
    const text = container.querySelector('script')?.textContent ?? '';

    for (const field of [
      'offers',
      'price',
      'aggregateRating',
      'review',
      'ratingValue',
      'numberOf',
      'userInteractionCount',
    ]) {
      expect(text).not.toContain(field);
    }
  });
});
