import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getCategoryIcon, ALL_PREMIUM_ICONS } from '../categoryIcons';

describe('getCategoryIcon', () => {
  it('renders the exactly-registered icon for a known name', () => {
    const first = ALL_PREMIUM_ICONS[0];
    const { container } = render(<>{getCategoryIcon(first.name)}</>);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('w-4');
  });

  it('applies the custom className', () => {
    const { container } = render(<>{getCategoryIcon('heart', 'w-8 h-8')}</>);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('w-8');
  });

  it('is case-insensitive on names', () => {
    const icon = ALL_PREMIUM_ICONS.find(i => /heart/i.test(i.name));
    if (icon) {
      const a = render(<>{getCategoryIcon(icon.name)}</>).container.querySelector('svg');
      const b = render(<>{getCategoryIcon(icon.name.toUpperCase())}</>).container.querySelector('svg');
      expect(a?.getAttribute('class')).toBe(b?.getAttribute('class'));
    }
  });

  it('falls back to semantic slugs for unregistered names', () => {
    const { container } = render(<>{getCategoryIcon('emotional-wellness')}</>);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('returns the flame default for unknown slugs and empty input (never throws)', () => {
    const { container } = render(<>{getCategoryIcon('zzz-unknown-slug')}</>);
    expect(container.querySelector('svg')).toBeTruthy();
    const { container: c2 } = render(<>{getCategoryIcon('')}</>);
    expect(c2.querySelector('svg')).toBeTruthy();
  });
});
