import { getConfig } from './config/env.js';
import { closeDatabase } from './db/pool.js';
import { createApp } from './app/app.js';

const config = getConfig();
const app = createApp({ config });
const { port } = config;
const server = app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
function shutdown() {
  server.close(() => {
    closeDatabase().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
