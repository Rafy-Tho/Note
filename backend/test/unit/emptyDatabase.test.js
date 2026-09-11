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

  it('truncates application tables in a transaction', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [
            { qualified_name: 'public.notes' },
            { qualified_name: 'public.users' },
          ],
        })
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
      expect.stringContaining('pg_catalog.pg_tables'),
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('TRUNCATE TABLE public.notes, public.users'),
    );
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back and releases the client when truncation fails', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ qualified_name: 'public.users' }] })
        .mockRejectedValueOnce(new Error('truncate failed'))
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
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });
});
