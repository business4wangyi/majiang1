import { expect } from 'chai';
import { parseMove } from '../../src/othello/strategy/integrations/edax-integration';

describe('Edax integration parseMove', () => {
  it('prefixed line should win over ordinary coordinates', () => {
    const raw = [
      'info candidate H8',
      'REMOVE D3',
      '  bestmove = c4',
      'tail B2'
    ].join('\n');

    const parsed = parseMove(raw);
    expect(parsed).to.not.equal(null);
    expect(parsed!.action).to.deep.equal({ row: 3, col: 2 });
    expect(parsed!.matchedFragment).to.deep.equal({
      mode: 'prefixed',
      source: 'line 3: bestmove = c4',
      coordinate: 'C4'
    });
  });

  it('should fallback to the last legal coordinate when no prefixed line exists', () => {
    const raw = [
      'board eval: A1',
      'pv: h8 g7',
      'final d3'
    ].join('\n');

    const parsed = parseMove(raw);
    expect(parsed).to.not.equal(null);
    expect(parsed!.action).to.deep.equal({ row: 2, col: 3 });
    expect(parsed!.matchedFragment).to.deep.equal({
      mode: 'fallback',
      source: 'line 3: final d3',
      coordinate: 'D3'
    });
  });

  it('REMOVE/SOMETHING MOVE lines must not be treated as prefixed hits', () => {
    const raw = [
      'REMOVE D3',
      'SOMETHING MOVE C4',
      'plain B2'
    ].join('\n');

    const parsed = parseMove(raw);
    expect(parsed).to.not.equal(null);
    expect(parsed!.action).to.deep.equal({ row: 1, col: 1 });
    expect(parsed!.matchedFragment).to.deep.equal({
      mode: 'fallback',
      source: 'line 3: plain B2',
      coordinate: 'B2'
    });
  });
});
