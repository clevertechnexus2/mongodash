const path = require('path');
const { MongoBinary } = require('mongodb-memory-server-core');

const version = process.env.MONGOD_VERSION || '8.0.17';
const downloadDir = path.join(__dirname, '..', 'node_modules', '.cache', 'mongodb-binaries');

MongoBinary.getPath({ version, downloadDir })
  .then((binaryPath) => {
    console.log(`[build] MongoDB ${version} binary ready at ${binaryPath}`);
  })
  .catch((error) => {
    console.error(`[build] Failed to prepare MongoDB ${version} binary: ${error.message}`);
    process.exitCode = 1;
  });
