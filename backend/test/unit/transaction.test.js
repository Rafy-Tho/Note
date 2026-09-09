import { describe, expect, it, vi } from 'vitest';
import { withTransaction } from '../../src/db/transaction.js';

function createDatabaseClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('withTransaction', () => {
  it('commits successful work and releases the client', async () => {
    const client = createDatabaseClient();
    const databasePool = { connect: vi.fn().mockResolvedValue(client) };

    await expect(
      withTransaction(async () => 'result', databasePool),
    ).resolves.toBe('result');
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back failed work and preserves the original error', async () => {
    const client = createDatabaseClient();
    const databasePool = { connect: vi.fn().mockResolvedValue(client) };
    const failure = new Error('operation failed');

    await expect(
      withTransaction(() => Promise.reject(failure), databasePool),
    ).rejects.toBe(failure);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });
});
