import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDriveClient } from '../../../clients.js';
import { register } from './listComments.js';

vi.mock('../../../clients.js', () => ({
  getDriveClient: vi.fn(),
}));

const mockLog = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
let toolExecute: (args: any, context: any) => Promise<string>;
let commentsList: ReturnType<typeof vi.fn>;

describe('listComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    commentsList = vi.fn(async ({ pageToken }: any) =>
      pageToken
        ? { data: { comments: [{ id: 'c2', replies: [] }] } }
        : {
            data: {
              comments: [{ id: 'c1', modifiedTime: '2026-10-01', replies: [{ id: 'r1' }] }],
              nextPageToken: 'p2',
            },
          }
    );
    vi.mocked(getDriveClient).mockResolvedValue({ comments: { list: commentsList } } as any);
    register({ addTool: (config: any) => (toolExecute = config.execute) } as any);
  });

  it('follows every page and asks Drive for the fields it reports', async () => {
    const { comments } = JSON.parse(await toolExecute({ documentId: 'doc' }, { log: mockLog }));

    expect(comments.map((c: any) => c.id)).toEqual(['c1', 'c2']);
    expect(comments[0]).toMatchObject({ modifiedTime: '2026-10-01', replyCount: 1 });
    expect(commentsList).toHaveBeenCalledTimes(2);
    expect(commentsList.mock.calls[1][0].pageToken).toBe('p2');
    expect(commentsList.mock.calls[0][0].fields).toMatch(/modifiedTime.*replies\(id\)/);
  });
});
