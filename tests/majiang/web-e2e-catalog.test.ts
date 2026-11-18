import { expect } from 'chai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const catalog = require('../../scripts/test/majiang-web-e2e-catalog');

describe('majiang-web-e2e-catalog', () => {
  it('E01–E17 齐全且 id 唯一', () => {
    const cases = catalog.getE2eCases();
    expect(cases.map((c: { id: string }) => c.id)).to.deep.equal(
      Array.from({ length: 17 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)
    );
  });

  it('smoke 恰为 E01–E08；full 含全部', () => {
    const smoke = catalog.casesForSuite('smoke').map((c: { id: string }) => c.id);
    const full = catalog.casesForSuite('full').map((c: { id: string }) => c.id);
    expect(smoke).to.deep.equal(['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08']);
    expect(full).to.have.length(17);
  });

  it('每条有 runner；E16 已装夹具不 defer；E17 诚实 defer', () => {
    for (const c of catalog.getE2eCases()) {
      expect(c.runner, c.id).to.be.a('string').and.not.empty;
    }
    const byId = Object.fromEntries(
      catalog.getE2eCases().map((c: { id: string }) => [c.id, c])
    );
    expect(byId.E16.defer).to.not.equal(true);
    expect(byId.E16.fixture).to.equal('angang-ready');
    expect(byId.E17.defer).to.equal(true);
    expect(byId.E17.deferReason).to.be.a('string').and.not.empty;
  });
});
