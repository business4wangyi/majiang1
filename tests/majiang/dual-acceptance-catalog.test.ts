import { expect } from 'chai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const catalog = require('../../scripts/test/majiang-dual-acceptance-catalog.js');

describe('dual acceptance catalog (MJ-ACC matrix mirror)', function () {
  it('暴露规格八行 ID 且档位/依赖 CAP 形状正确', function () {
    const cases = catalog.getAcceptanceCases();
    const ids = cases.map((c: { id: string }) => c.id);
    expect(ids).to.deep.equal([
      'MJ-ACC-ENG-01',
      'MJ-ACC-SNAP-01',
      'MJ-ACC-CLI-01',
      'MJ-ACC-CLI-02',
      'MJ-ACC-API-01',
      'MJ-ACC-WEB-01',
      'MJ-ACC-WEB-02',
      'MJ-ACC-DUAL-01',
    ]);

    const byId = Object.fromEntries(cases.map((c: { id: string }) => [c.id, c]));
    expect(byId['MJ-ACC-ENG-01'].tier).to.equal('default');
    expect(byId['MJ-ACC-ENG-01'].status).to.equal('green');
    expect(byId['MJ-ACC-CLI-02'].tier).to.equal('nightly');
    expect(byId['MJ-ACC-API-01'].tier).to.equal('smoke');
    expect(byId['MJ-ACC-SNAP-01'].status).to.equal('green');
    expect(catalog.isRunnable(byId['MJ-ACC-ENG-01'])).to.equal(true);
    expect(catalog.isRunnable(byId['MJ-ACC-SNAP-01'])).to.equal(true);
    expect(catalog.isRunnable(byId['MJ-ACC-WEB-01'])).to.equal(true);
    expect(catalog.isRunnable(byId['MJ-ACC-WEB-02'])).to.equal(true);
    expect(byId['MJ-ACC-DUAL-01'].status).to.equal('green');
    expect(catalog.isRunnable(byId['MJ-ACC-DUAL-01'])).to.equal(true);
  });

  it('casesForTier 按档位过滤', function () {
    const smokeIds = catalog.casesForTier('smoke').map((c: { id: string }) => c.id);
    expect(smokeIds).to.deep.equal([
      'MJ-ACC-API-01',
      'MJ-ACC-WEB-01',
      'MJ-ACC-WEB-02',
      'MJ-ACC-DUAL-01',
    ]);
  });
});
