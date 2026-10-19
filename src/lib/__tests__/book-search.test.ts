import { filterBooks, normalizeBookQuery } from '../book-search';

const BOOKS = [
  { id: 1, name: 'Gênesis' },
  { id: 18, name: 'Jó' },
  { id: 43, name: 'João' },
  { id: 46, name: '1 Coríntios' },
  { id: 47, name: '2 Coríntios' },
  { id: 62, name: '1 João' },
];

describe('normalizeBookQuery', () => {
  it('lowercases, strips accents and whitespace', () => {
    expect(normalizeBookQuery('  1 Coríntios ')).toBe('1corintios');
    expect(normalizeBookQuery('GÊNESIS')).toBe('genesis');
  });
});

describe('filterBooks', () => {
  it('returns every book (same reference) for an empty or blank query', () => {
    expect(filterBooks(BOOKS, '')).toBe(BOOKS);
    expect(filterBooks(BOOKS, '   ')).toBe(BOOKS);
  });

  it('matches regardless of case and accents', () => {
    expect(filterBooks(BOOKS, 'genesis').map((b) => b.id)).toEqual([1]);
    expect(filterBooks(BOOKS, 'JOAO').map((b) => b.id)).toEqual([43, 62]);
  });

  it('ignores spaces so numbered books match compactly', () => {
    expect(filterBooks(BOOKS, '1co').map((b) => b.id)).toEqual([46]);
    expect(filterBooks(BOOKS, '2 cor').map((b) => b.id)).toEqual([47]);
  });

  it('matches substrings and keeps canonical order', () => {
    expect(filterBooks(BOOKS, 'corin').map((b) => b.id)).toEqual([46, 47]);
    expect(filterBooks(BOOKS, 'jo').map((b) => b.id)).toEqual([18, 43, 62]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterBooks(BOOKS, 'xyz')).toEqual([]);
  });
});
