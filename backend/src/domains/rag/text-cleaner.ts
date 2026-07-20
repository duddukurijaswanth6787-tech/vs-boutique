export function cleanText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\x00-\x08\x0B\f\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
