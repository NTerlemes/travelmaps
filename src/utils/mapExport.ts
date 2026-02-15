import { toPng, toJpeg, toSvg } from 'html-to-image';

type ExportFormat = 'png' | 'jpeg' | 'svg';

const EXTENSIONS: Record<ExportFormat, string> = {
  png: 'png',
  jpeg: 'jpeg',
  svg: 'svg',
};

export async function exportMapAsImage(
  element: HTMLElement,
  format: ExportFormat,
  filename?: string
): Promise<void> {
  const options = format === 'jpeg' ? { quality: 0.95 } : {};

  let dataUrl: string;
  switch (format) {
    case 'png':
      dataUrl = await toPng(element, options);
      break;
    case 'jpeg':
      dataUrl = await toJpeg(element, options);
      break;
    case 'svg':
      dataUrl = await toSvg(element, options);
      break;
  }

  const ext = EXTENSIONS[format];
  const name = filename ? `${filename}.${ext}` : `travel-map-${Date.now()}.${ext}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = name;
  link.click();
}
