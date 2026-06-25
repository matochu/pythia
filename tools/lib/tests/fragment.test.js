import { describe, it, expect } from 'vitest';
import { parseLinkFragment } from '../references/fragment.js';

describe('parseLinkFragment', () => {
  it('returns empty anchor and relType for empty fragment', () => {
    expect(parseLinkFragment('')).toEqual({ anchor: '', relType: '' });
    expect(parseLinkFragment(undefined)).toEqual({ anchor: '', relType: '' });
  });

  it('returns anchor with no relType for plain heading slug', () => {
    expect(parseLinkFragment('sec')).toEqual({ anchor: 'sec', relType: '' });
    expect(parseLinkFragment('my-heading')).toEqual({ anchor: 'my-heading', relType: '' });
  });

  it('parses #@label → empty anchor + relType', () => {
    expect(parseLinkFragment('@source')).toEqual({ anchor: '', relType: 'source' });
    expect(parseLinkFragment('@based-on')).toEqual({ anchor: '', relType: 'based-on' });
  });

  it('parses #anchor@label → anchor + relType', () => {
    expect(parseLinkFragment('sec@based-on')).toEqual({ anchor: 'sec', relType: 'based-on' });
    expect(parseLinkFragment('a1b2c3d4@source')).toEqual({ anchor: 'a1b2c3d4', relType: 'source' });
  });

  it('splits on first @ only (multi-@ fragment)', () => {
    expect(parseLinkFragment('sec@foo@bar')).toEqual({ anchor: 'sec', relType: 'foo@bar' });
  });

  it('trims whitespace', () => {
    expect(parseLinkFragment('  sec  @  source  ')).toEqual({ anchor: 'sec', relType: 'source' });
  });

  it('returns no relType for empty label after @', () => {
    expect(parseLinkFragment('sec@')).toEqual({ anchor: 'sec', relType: '' });
    expect(parseLinkFragment('@')).toEqual({ anchor: '', relType: '' });
  });
});
