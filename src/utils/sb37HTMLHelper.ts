
export const addHeadingIds = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  headingElements.forEach((el, i) => {
    const id = `heading-${i}`;
    el.setAttribute('id', id);
  });

  return doc.body.innerHTML;
};
