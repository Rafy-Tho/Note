import { describe, expect, it, vi } from 'vitest';
import {
  emptyDatabase,
  EMPTY_DATABASE_CONFIRMATION,
} from '../../src/db/emptyDatabase.js';

function fakePool(client) {
  return { connect: vi.fn(async () => client) };
}

describe('emptyDatabase', () => {
  it('requires explicit confirmation', async () => {
    const pool = fakePool({ connect: vi.fn() });

    await expect(
      emptyDatabase({ databasePool: pool, nodeEnv: 'development' }),
    ).rejects.toThrow('requires confirmation');
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('cannot empty a production database', async () => {
    const pool = fakePool({ connect: vi.fn() });

    await expect(
      emptyDatabase({
        databasePool: pool,
        nodeEnv: 'production',
        confirmation: EMPTY_DATABASE_CONFIRMATION,
      }),
    ).rejects.toThrow('disabled in production');
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('truncates application tables with foreign key checks disabled', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ table_name: 'notes' }, { table_name: 'users' }],
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };

    await emptyDatabase({
      databasePool: fakePool(client),
      nodeEnv: 'development',
      confirmation: EMPTY_DATABASE_CONFIRMATION,
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('information_schema.tables'),
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      'SET FOREIGN_KEY_CHECKS = 0',
    );
    expect(client.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('TRUNCATE TABLE `notes`, `users`'),
    );
    expect(client.query).toHaveBeenNthCalledWith(
      5,
      'SET FOREIGN_KEY_CHECKS = 1',
    );
    expect(client.query).toHaveBeenNthCalledWith(6, 'COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('restores foreign key checks and rolls back when truncation fails', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ table_name: 'users' }] })
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('truncate failed'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      release: vi.fn(),
    };

    await expect(
      emptyDatabase({
        databasePool: fakePool(client),
        nodeEnv: 'test',
        confirmation: EMPTY_DATABASE_CONFIRMATION,
      }),
    ).rejects.toThrow('truncate failed');
    expect(client.query).toHaveBeenNthCalledWith(
      5,
      'SET FOREIGN_KEY_CHECKS = 1',
    );
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });
});
