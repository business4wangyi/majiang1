const glob = require('glob');
const Mocha = require('mocha');

require('ts-node/register');

const originalExit = process.exit.bind(process);
process.exit = ((code = 0) => {
  if (code === 0) {
    throw new Error('process.exit(0) was called during tests');
  }
  originalExit(code);
});

const mocha = new Mocha();
for (const file of glob.sync('tests/**/*.test.ts', { absolute: true })) {
  mocha.addFile(file);
}

mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
