import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';

export const textToHtml = (text: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  return doc;
};

function getTextFromHTML(html: string, excludeH1?: boolean): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove <h1> headings
  if (excludeH1) {
    doc.querySelectorAll('h1').forEach(h1 => h1.remove());
  }

  // Separate block elements with line breaks
  const blocks = Array.from(doc.body.children);
  return blocks.map(el => el.textContent?.trim() || '').join('.\n');
}

function getTextFromElement(container: HTMLElement, excludeH1?: boolean): string {
  const clone = container.cloneNode(true) as HTMLElement;
  if (excludeH1) {
    clone.querySelectorAll('h1').forEach(h1 => h1.remove());
  }

  const blocks = Array.from(clone.children);
  return blocks.map(el => el.textContent?.trim() || '').join('.\n');
}

export function getCleanText({
  container,
  editMode,
  excludeH1 = true,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
  excludeH1?: boolean;
}): string {
  if (editMode) {
    return getTextFromHTML(container.currentContent, excludeH1);
  } else {
    return getTextFromElement(container, excludeH1);
  }
}
