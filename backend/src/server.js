import { getConfig } from './config.js';
import { pool } from './db.js';
import { createApp } from './app.js';

const { port } = getConfig();
const app = createApp();
const server = app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
