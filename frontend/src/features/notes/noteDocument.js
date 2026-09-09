export function documentText(document) {
  const text = [];
  function visit(node) {
    if (!node) return;
    if (node.type === 'text') text.push(node.text ?? '');
    node.content?.forEach(visit);
    if (node.type === 'paragraph') text.push('\n');
  }
  visit(document);
  return text.join('').trim();
}

export function documentFromText(text) {
  return {
    type: 'doc',
    content: text
      ? text.split(/\n+/).map((paragraph) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: paragraph }],
        }))
      : [],
  };
}
