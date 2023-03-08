import { IssueStatus } from "@prisma/client";

export const canChangeStatus = (status: IssueStatus) =>
  !(status === "completed" || status === "canceled");
