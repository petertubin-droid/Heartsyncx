import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ImageLightbox from '../ImageLightbox';

const IMAGE = { src: 'https://example.com/heart.jpg', alt: 'A diagram of the workflow', caption: 'Figure 1' };

describe('ImageLightbox (a11y dialog contract)', () => {
  afterEach(cleanup);

  it('renders nothing when closed', () => {
    const { container } = render(<ImageLightbox image={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an aria-modal dialog with the image alt as its accessible name', () => {
    render(<ImageLightbox image={IMAGE} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(IMAGE.alt);
    expect(screen.getByAltText(IMAGE.alt)).toBeTruthy();
    expect(screen.getByText(IMAGE.caption)).toBeTruthy();
  });

  it('closes on Escape and on backdrop click, and restores focus to the invoker', () => {
    const invoker = document.createElement('button');
    invoker.textContent = 'open image';
    document.body.appendChild(invoker);
    invoker.focus();

    const Holder = () => {
      const [img, setImg] = React.useState(IMAGE);
      return <ImageLightbox image={img} onClose={() => setImg(null)} />;
    };
    render(<Holder />);
    fireEvent.keyDown(document, { key: 'Escape' });
    // Escape unmounts the dialog -> focus returns to the invoker
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(invoker);

    // re-open, then backdrop click also closes
    const Holder2 = () => {
      const [img, setImg] = React.useState(IMAGE);
      return <ImageLightbox image={img} onClose={() => setImg(null)} />;
    };
    render(<Holder2 />);
    fireEvent.click(document.querySelector('.fixed.inset-0')!);
    expect(screen.queryByRole('dialog')).toBeNull();
    invoker.remove();
  });

  it('traps Tab focus inside the dialog', () => {
    render(<ImageLightbox image={IMAGE} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: 'Close image viewer' });
    expect(document.activeElement).toBe(closeBtn);

    // Tab from the last focusable wraps to the first
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);
  });
});
