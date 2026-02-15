import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportMapAsImage } from './mapExport';

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toJpeg: vi.fn(),
  toSvg: vi.fn(),
}));

import { toPng, toJpeg, toSvg } from 'html-to-image';

describe('exportMapAsImage', () => {
  let element: HTMLDivElement;
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.clearAllMocks();
    element = originalCreateElement('div');

    mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockLink as unknown as HTMLAnchorElement;
      return originalCreateElement(tag);
    });
  });

  it('calls toPng for png format', async () => {
    const dataUrl = 'data:image/png;base64,abc';
    vi.mocked(toPng).mockResolvedValue(dataUrl);

    await exportMapAsImage(element, 'png');

    expect(toPng).toHaveBeenCalledWith(element, expect.any(Object));
    expect(toJpeg).not.toHaveBeenCalled();
    expect(toSvg).not.toHaveBeenCalled();
  });

  it('calls toJpeg for jpeg format', async () => {
    const dataUrl = 'data:image/jpeg;base64,abc';
    vi.mocked(toJpeg).mockResolvedValue(dataUrl);

    await exportMapAsImage(element, 'jpeg');

    expect(toJpeg).toHaveBeenCalledWith(element, expect.objectContaining({ quality: 0.95 }));
    expect(toPng).not.toHaveBeenCalled();
  });

  it('calls toSvg for svg format', async () => {
    const dataUrl = 'data:image/svg+xml;base64,abc';
    vi.mocked(toSvg).mockResolvedValue(dataUrl);

    await exportMapAsImage(element, 'svg');

    expect(toSvg).toHaveBeenCalledWith(element, expect.any(Object));
    expect(toPng).not.toHaveBeenCalled();
  });

  it('triggers download with correct filename extension', async () => {
    const dataUrl = 'data:image/png;base64,abc';
    vi.mocked(toPng).mockResolvedValue(dataUrl);

    await exportMapAsImage(element, 'png');

    expect(mockLink.href).toBe(dataUrl);
    expect(mockLink.download).toMatch(/^travel-map-\d+\.png$/);
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('uses custom filename when provided', async () => {
    const dataUrl = 'data:image/jpeg;base64,abc';
    vi.mocked(toJpeg).mockResolvedValue(dataUrl);

    await exportMapAsImage(element, 'jpeg', 'my-map');

    expect(mockLink.download).toBe('my-map.jpeg');
  });

  it('throws on export failure', async () => {
    vi.mocked(toPng).mockRejectedValue(new Error('Capture failed'));

    await expect(exportMapAsImage(element, 'png')).rejects.toThrow('Capture failed');
  });
});
