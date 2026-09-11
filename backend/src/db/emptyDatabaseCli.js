import { closeDatabase } from './pool.js';
import { emptyDatabase, EMPTY_DATABASE_CONFIRMATION } from './emptyDatabase.js';

function readConfirmation(argumentsList) {
  const confirmationArgument = argumentsList.find((argument) =>
    argument.startsWith('--confirm='),
  );
  return confirmationArgument?.slice('--confirm='.length);
}

try {
  await emptyDatabase({
    confirmation: readConfirmation(process.argv.slice(2)),
  });
  console.log('Application database data emptied.');
} catch (error) {
  console.error(error.message);
  console.error(
    `Usage: npm run db:empty -- --confirm=${EMPTY_DATABASE_CONFIRMATION}`,
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
