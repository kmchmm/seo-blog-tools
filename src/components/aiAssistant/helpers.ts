import { WORD_PER_SEC_BATCH, WORD_PER_SEC_DOCUMENT } from './constants';

export const getInputLabel = (activeCard: string) => {
  if (activeCard === 'SB37 Analysis - Per Document') {
    return 'Enter the document URL:';
  }
  if (activeCard === 'SB37 Analysis - By Batch') {
    return 'Enter the spreadsheet URL:';
  }
  return '';
};

export const getEstimatedTime = (wordCount: number, type: 'document' | 'batch') => {
  const WORD_PER_SEC = type === 'document' ? WORD_PER_SEC_DOCUMENT : WORD_PER_SEC_BATCH;
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

export const getModels = (aiAssistant: string) => {
  if (aiAssistant === 'claude') {
    return [
      { label: 'claude-opus-4-20250514', value: 'claude-opus-4-20250514' },
      { label: 'claude-sonnet-4-20250514', value: 'claude-sonnet-4-20250514' },
      { label: 'claude-3-7-sonnet-20250219', value: 'claude-3-7-sonnet-20250219' },
      { label: 'claude-3-5-haiku-20241022', value: 'claude-3-5-haiku-20241022' },
      { label: 'claude-3-5-sonnet-20241022', value: 'claude-3-5-sonnet-20241022' },
      { label: 'claude-3-5-sonnet-20240620', value: 'claude-3-5-sonnet-20240620' },
      { label: 'claude-3-haiku-20240307', value: 'claude-3-haiku-20240307' },
    ];
  }

  if (aiAssistant === 'gemini') {
    return [
      { label: 'gemini-2.5-pro', value: 'gemini-2.5-pro' },
      { label: 'gemini-2.5-flash', value: 'gemini-2.5-flash' },
      { label: 'gemini-2.5-flash-lite', value: 'gemini-2.5-flash-lite' },
      { label: 'gemini-2.0-flash', value: 'gemini-2.0-flash' },
      { label: 'gemini-2.0-flash-lite', value: 'gemini-2.0-flash-lite' },
    ];
  }

  return [];
};
