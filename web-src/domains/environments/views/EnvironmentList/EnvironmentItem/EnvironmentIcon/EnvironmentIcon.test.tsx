import { assetUrl } from './EnvironmentIcon';

describe('assetUrl', () => {
  it('keeps legacy asset URL strings unchanged', () => {
    expect(assetUrl('/assets/docker.svg')).toBe('/assets/docker.svg');
  });

  it('unwraps asset objects emitted by the Next.js build', () => {
    expect(assetUrl({ src: '/_next/static/media/docker.svg' })).toBe(
      '/_next/static/media/docker.svg'
    );
  });
});
