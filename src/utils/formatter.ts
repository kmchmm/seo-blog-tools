import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';

export const textToHtml = (text: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  return doc;
};

function getTextExcludingH1FromHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove <h1> headings
  doc.querySelectorAll('h1').forEach(h1 => h1.remove());

  // Separate block elements with line breaks
  const blocks = Array.from(doc.body.children);
  return blocks.map(el => el.textContent?.trim() || '').join('.\n');
}

function getTextExcludingH1FromElement(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('h1').forEach(h1 => h1.remove());

  const blocks = Array.from(clone.children);
  return blocks.map(el => el.textContent?.trim() || '').join('.\n');
}

export function getCleanText({
  container,
  editMode,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
}): string {
  if (editMode) {
    return getTextExcludingH1FromHTML(container.currentContent);
  } else {
    return getTextExcludingH1FromElement(container);
  }
}
