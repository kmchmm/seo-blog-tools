export const htmlToPlainText = (html: string) => {
  // Create a temporary DOM element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Use textContent to extract plain text
  return tempDiv.textContent || tempDiv.innerText || '';
};
