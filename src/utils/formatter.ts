import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';

export const textToHtml = (text: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  return doc;
};

export function getTextExcludingH1FromHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('h1').forEach(h1 => h1.remove());

  return doc.body.textContent || '';
}

export function getTextExcludingH1FromElement(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('h1').forEach(h1 => h1.remove());
  return clone.textContent || '';
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
