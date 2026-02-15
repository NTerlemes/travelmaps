import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportControls } from './ExportControls';

vi.mock('../utils/mapExport', () => ({
  exportMapAsImage: vi.fn(),
}));

import { exportMapAsImage } from '../utils/mapExport';

describe('ExportControls', () => {
  const defaultProps = {
    mapRef: { current: document.createElement('div') } as React.RefObject<HTMLDivElement>,
    centerMap: vi.fn().mockResolvedValue(undefined),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exportMapAsImage).mockResolvedValue(undefined);
  });

  it('renders export section title', () => {
    render(<ExportControls {...defaultProps} />);
    expect(screen.getByText('Export Map')).toBeInTheDocument();
  });

  it('renders PNG, JPEG, and SVG buttons', () => {
    render(<ExportControls {...defaultProps} />);
    expect(screen.getByRole('button', { name: /png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jpeg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /svg/i })).toBeInTheDocument();
  });

  it('calls centerMap before exporting', async () => {
    render(<ExportControls {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /png/i }));

    await waitFor(() => {
      expect(defaultProps.centerMap).toHaveBeenCalled();
      expect(exportMapAsImage).toHaveBeenCalledWith(
        defaultProps.mapRef.current,
        'png'
      );
    });
  });

  it('calls exportMapAsImage with jpeg format on JPEG click', async () => {
    render(<ExportControls {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /jpeg/i }));

    await waitFor(() => {
      expect(exportMapAsImage).toHaveBeenCalledWith(
        defaultProps.mapRef.current,
        'jpeg'
      );
    });
  });

  it('calls exportMapAsImage with svg format on SVG click', async () => {
    render(<ExportControls {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /svg/i }));

    await waitFor(() => {
      expect(exportMapAsImage).toHaveBeenCalledWith(
        defaultProps.mapRef.current,
        'svg'
      );
    });
  });

  it('calls onSuccess after successful export', async () => {
    render(<ExportControls {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /png/i }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith('Map exported as PNG!');
    });
  });

  it('calls onError on export failure', async () => {
    vi.mocked(exportMapAsImage).mockRejectedValue(new Error('fail'));
    render(<ExportControls {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /png/i }));

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith('Failed to export map. Please try again.');
    });
  });

  it('disables buttons while export is in progress', async () => {
    let resolveCenterMap: () => void;
    const props = {
      ...defaultProps,
      centerMap: vi.fn().mockImplementation(
        () => new Promise<void>(resolve => { resolveCenterMap = resolve; })
      ),
    };

    render(<ExportControls {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /png/i }));

    // Buttons should be disabled while exporting
    expect(screen.getByRole('button', { name: /png/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /jpeg/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /svg/i })).toBeDisabled();

    // Resolve centerMap and let export complete
    resolveCenterMap!();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /png/i })).not.toBeDisabled();
    });
  });

  it('disables buttons when mapRef is null', () => {
    const nullRef = { current: null } as React.RefObject<HTMLDivElement>;
    render(<ExportControls {...defaultProps} mapRef={nullRef} />);

    expect(screen.getByRole('button', { name: /png/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /jpeg/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /svg/i })).toBeDisabled();
  });
});
