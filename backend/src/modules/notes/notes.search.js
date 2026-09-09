export function documentText(contentJson) {
  const values = [];

  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'text' && typeof value.text === 'string')
      values.push(value.text);
    if (Array.isArray(value.content)) value.content.forEach(visit);
  }

  visit(contentJson);
  return values.join(' ');
}

export function buildSearchableText(title, contentJson, tagNames = []) {
  return [title, documentText(contentJson), ...tagNames]
    .filter(Boolean)
    .join(' ')
    .trim();
}
