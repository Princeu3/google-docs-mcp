import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { getDriveClient } from '../../../clients.js';
import { DocumentIdParameter } from '../../../types.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listComments',
    description:
      'Lists all comments in a document with their IDs, authors, status, and quoted text. Returns data needed to call getComment, replyToComment, resolveComment, or deleteComment.',
    parameters: DocumentIdParameter,
    execute: async (args, { log }) => {
      log.info(`Listing comments for document ${args.documentId}`);
      const drive = await getDriveClient();

      try {
        // The field mask must name every field read below; Drive omits the rest.
        const comments: any[] = [];
        let pageToken: string | undefined;
        do {
          const response = await drive.comments.list({
            fileId: args.documentId,
            fields:
              'nextPageToken,comments(id,content,quotedFileContent(value),author(displayName),createdTime,modifiedTime,resolved,replies(id))',
            pageSize: 100,
            pageToken,
          });
          comments.push(...(response.data.comments || []));
          pageToken = response.data.nextPageToken || undefined;
        } while (pageToken);

        return JSON.stringify(
          {
            comments: comments.map((comment) => ({
              id: comment.id,
              author: comment.author?.displayName || null,
              content: comment.content,
              quotedText: comment.quotedFileContent?.value || null,
              resolved: comment.resolved || false,
              createdTime: comment.createdTime,
              modifiedTime: comment.modifiedTime,
              replyCount: comment.replies?.length || 0,
            })),
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error listing comments: ${error.message || error}`);
        throw new UserError(`Failed to list comments: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
