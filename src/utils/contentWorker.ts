function contentWorker() {
  self.onmessage = (e: MessageEvent) => {
    let text = e.data;

    // Normalize and clean text
    text = text
      .replace(/\u00A0/g, ' ')
      .replace(/[•–—]/g, '')
      .replace(/[“”‘’]/g, "'")
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Match words with custom rule (includes numbers and hyphenated parts)
    const wordMatches = text.match(/\b(?:\d+[-]\d+|\d+|[a-zA-Z]{1,}(?:[-'][a-zA-Z]+)*)\b/g);
    const wordCount = wordMatches ? wordMatches.length : 0;

    // Split into sentences and detect same starting word in 3 consecutive sentences
    const sentences = text.split(/(?<=[.?!])\s+/);
    const sameStartWordSequences: { word: string; startIndex: number }[] = [];

    for (let i = 0; i <= sentences.length - 3; i++) {
      const w1 = sentences[i].trim().split(/\s+/)[0]?.toLowerCase();
      const w2 = sentences[i + 1].trim().split(/\s+/)[0]?.toLowerCase();
      const w3 = sentences[i + 2].trim().split(/\s+/)[0]?.toLowerCase();

      if (w1 && w1 === w2 && w2 === w3) {
        sameStartWordSequences.push({ word: w1, startIndex: i });
      }
    }

    self.postMessage({ wordCount, sameStartWordSequences });
  };
}

export const createContentWorker = (): Worker => {
  const code = contentWorker.toString();
  const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};
