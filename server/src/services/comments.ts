import { insertComment, selectComments } from "../repositories/comments";
import { selectIssue } from "../repositories/issues";

interface ListCommentsParams {
  issue_id: string;
}

interface CreateCommentParams {
  issue_id: string;
  author_id: string;
  body: string;
}

export async function listComments(params: ListCommentsParams) {
  const { issue_id } = params;

  const issue = await selectIssue({ id: issue_id });

  if (!issue) return null;

  return selectComments({ issue_id });
}

export async function createComment(params: CreateCommentParams) {
  const { issue_id, author_id, body } = params;

  const issue = await selectIssue({ id: issue_id });

  if (!issue) return null;

  return insertComment({ issue_id, author_id, body });
}