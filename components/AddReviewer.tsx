import { FC } from "react";
import { Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { canChangeStatus } from "@/utils/issue-valicator";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Select, SimpleGrid } from "@mantine/core";

type Inputs = {
  type: "reviewer" | "approver";
  userId: string;
};

type Props = {
  issueId: string;
  refetch?: () => void;
};

export const AddReviewer: FC<Props> = ({ issueId, refetch }) => {
  const { data: issue, refetch: refetchIssue } = useQuery<
    Issue & {
      reviewers: User[];
      approvers: User[];
    }
  >("issue", async () => {
    const res = await fetch(`/api/issue/${issueId}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  const { data: users } = useQuery<User[]>("users", async () => {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  const form = useForm<Inputs>({
    initialValues: {
      type: "reviewer",
      userId: "",
    },
    validate: {
      type: (value) => {
        const parsed = z.enum(["reviewer", "approver"]).safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      userId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
    },
  });

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${issueId}/reviewer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const onSubmit = (data: Inputs) => {
    mutation.mutate(data, {
      onSuccess: () => {
        refetchIssue();
        refetch?.();
        form.reset();
      },
    });
  };

  if (!issue || !users) return null;
  if (!canChangeStatus(issue.status)) return null;

  const candidates = users.filter(
    (user) =>
      ![...issue.reviewers, ...issue.approvers].some((u) => u.id === user.id) &&
      user.id !== issue.assigneeId
  );

  return (
    <>
      <h2>Add Reviewer</h2>

      <form onSubmit={form.onSubmit(onSubmit)}>
        <SimpleGrid cols={2} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
          <Select
            label="Type"
            data={[
              { value: "reviewer", label: "Reviewer" },
              { value: "approver", label: "Approver" },
            ]}
            {...form.getInputProps("type")}
          />
          <Select
            label="Reviewer"
            data={candidates.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            {...form.getInputProps("userId")}
          />
        </SimpleGrid>
        <Button
          mt="md"
          type="submit"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan" }}
        >
          Add
        </Button>
      </form>
    </>
  );
};
