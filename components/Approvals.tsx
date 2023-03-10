import { FC } from "react";
import { Approval, Comment, Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { canChangeStatus } from "@/utils/issue-valicator";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Select, Space } from "@mantine/core";

type Inputs = {
  userId: string;
  approved: "true" | "false";
};

type Props = {
  issueId: string;
};

export const Approvals: FC<Props> = ({ issueId }) => {
  const { data: issue } = useQuery<
    Issue & { reviewers: User[]; approvers: User[] }
  >("issue", async () => {
    const res = await fetch(`/api/issue/${issueId}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const { data: approvals, refetch } = useQuery<(Approval & { user: User })[]>(
    "approvals",
    async () => {
      const res = await fetch(`/api/issue/${issueId}/approval`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );

  const form = useForm<Inputs>({
    validate: {
      userId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      approved: (value) => {
        const parsed = z.enum(["true", "false"]).safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
    },
  });

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const { userId } = data;
    const approved = data.approved === "true";
    const res = await fetch(`/api/issue/${issueId}/approval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, approved }),
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const onSubmit = (data: Inputs) => {
    mutation.mutate(data, {
      onSuccess: () => {
        refetch();
        form.setValues({});
        form.reset();
      },
    });
  };

  if (!issue || (issue.reviewers.length === 0 && issue.approvers.length === 0))
    return null;

  const checkers = [...(issue.reviewers ?? []), ...(issue.approvers ?? [])];

  return (
    <>
      {canChangeStatus(issue.status) && (
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Select
            label="User ID"
            data={checkers.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            defaultValue={issue.status}
            readOnly={!canChangeStatus(issue.status)}
            {...form.getInputProps("userId")}
          />
          <Select
            label="Approved"
            data={[
              { value: "true", label: "Approve" },
              { value: "false", label: "Reject" },
            ]}
            defaultValue={issue.status}
            readOnly={!canChangeStatus(issue.status)}
            {...form.getInputProps("approved")}
          />
          <Space h="sm" />
          <Button
            type="submit"
            variant="gradient"
            gradient={{ from: "indigo", to: "cyan" }}
          >
            Update
          </Button>
        </form>
      )}
      <div>
        Approved by{" "}
        {approvals
          ?.flatMap((approval) => (approval.approved ? approval.user.name : []))
          .join(", ")}
      </div>
    </>
  );
};
