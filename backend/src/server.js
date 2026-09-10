import { getConfig } from './config/env.js';
import { closeDatabase } from './db/pool.js';
import { createApp } from './app.js';

const { port } = getConfig();
const app = createApp();
const server = app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
console.log(getConfig());
function shutdown() {
  server.close(() => {
    closeDatabase().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
