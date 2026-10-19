import { selectIssueEvents } from "../repositories/events";
import { selectIssue } from "../repositories/issues";

interface ListIssueEventsParams {
  issue_id: string;
}

export async function listIssueEvents(params: ListIssueEventsParams) {
  const { issue_id } = params;

  const issue = await selectIssue({ id: issue_id });

  if (!issue) return null;

  return selectIssueEvents({ issue_id });
}