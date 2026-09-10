import { describe, expect, it } from 'vitest';
import {
  documentFromText,
  documentText,
  documentsEqual,
} from './noteDocument.js';

describe('note document conversion', () => {
  it('round trips blank and multiline editor content', () => {
    expect(documentText(documentFromText(''))).toBe('');
    expect(documentText(documentFromText('First line\nSecond line'))).toBe(
      'First line\nSecond line',
    );
  });

  it('extracts text from a saved rich-text document', () => {
    expect(
      documentText({
        type: 'doc',
        content: [
          { type: 'heading', content: [{ type: 'text', text: 'Heading' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
        ],
      }),
    ).toBe('HeadingBody');
  });

  it('recognizes equivalent documents with different object identities', () => {
    const localDocument = documentFromText('Saved content');
    const serverDocument = documentFromText('Saved content');

    expect(documentsEqual(localDocument, serverDocument)).toBe(true);
    expect(documentsEqual(localDocument, documentFromText('Changed'))).toBe(
      false,
    );
  });
});
