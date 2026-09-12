import { migrate } from './migrate.js';
import { closeDatabase } from './pool.js';

const direction = process.argv[2] === 'down' ? 'down' : 'up';

try {
  await migrate(direction);
} catch (error) {
  const context = error?.migration ? ` in ${error.migration}` : '';
  process.stderr.write(
    `Database migration failed${context} (${error?.code ?? 'error'}).\n`,
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
