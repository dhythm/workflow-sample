import { FC } from "react";
import { Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { canChangeStatus } from "@/utils/issue-valicator";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Group, Radio, Select, SimpleGrid } from "@mantine/core";

type Inputs = {
  userId: string;
  approved: "true" | "false";
};

type Props = {
  issueId: string;
  refetch?: () => void;
};

export const ApproveIssue: FC<Props> = ({ issueId, refetch }) => {
  const { data: issue } = useQuery<
    Issue & { reviewers: User[]; approvers: User[] }
  >("issue", async () => {
    const res = await fetch(`/api/issue/${issueId}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  const form = useForm<Inputs>({
    initialValues: {
      userId: "",
      approved: "true",
    },
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
        refetch?.();
        form.reset();
      },
    });
  };

  if (!issue || (issue.reviewers.length === 0 && issue.approvers.length === 0))
    return null;

  const checkers = [...(issue.reviewers ?? []), ...(issue.approvers ?? [])];

  if (!canChangeStatus(issue.status)) return null;

  return (
    <>
      <h2>Approve Issue</h2>

      <form onSubmit={form.onSubmit(onSubmit)}>
        <SimpleGrid cols={2} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          <Select
            label="Reviewer"
            data={checkers.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            {...form.getInputProps("userId")}
          />
          <Radio.Group
            label="Status"
            name="approved"
            {...form.getInputProps("approved")}
          >
            <Group mt="xs">
              <Radio value="true" label="Approve" />
              <Radio value="false" label="Reject" />
            </Group>
          </Radio.Group>
        </SimpleGrid>
        <Button
          mt="md"
          type="submit"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan" }}
        >
          Send
        </Button>
      </form>
    </>
  );
};
