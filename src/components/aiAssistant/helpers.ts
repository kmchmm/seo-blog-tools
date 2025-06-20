export const getInputLabel = (activeCard: string) => {
  if (activeCard === 'SB37 Analysis - Per Document') {
    return 'Enter the document URL:';
  }
  if (activeCard === 'SB37 Analysis - By Batch') {
    return 'Enter the spreadsheet URL:';
  }
  return '';
};
