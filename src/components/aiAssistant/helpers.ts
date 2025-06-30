export const getInputLabel = (activeCard: string) => {
  if (activeCard === 'SB37 Analysis - Per Document') {
    return 'Enter the document URL:';
  }
  if (activeCard === 'SB37 Analysis - By Batch') {
    return 'Enter the spreadsheet URL:';
  }
  return '';
};

const WORD_PER_SEC = 42;

export const getEstimatedTime = (wordCount: number) => {
  const totalSeconds = wordCount / WORD_PER_SEC;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}`);

  return parts.join(' ');
};
