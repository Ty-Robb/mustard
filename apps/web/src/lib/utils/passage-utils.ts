export const parseVerseRange = (passage: string): { start?: number; end?: number } | undefined => {
  const match = passage.match(/:(\d+)-(\d+)$/);
  if (match) {
    return {
      start: parseInt(match[1], 10),
      end: parseInt(match[2], 10),
    };
  }
  return undefined;
};