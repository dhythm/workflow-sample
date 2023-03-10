import { FC } from "react";
import { Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { canChangeStatus } from "@/utils/issue-valicator";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Select, Space } from "@mantine/core";

type Inputs = {
  type: "weak" | "strong";
  userId: string;
};

type Props = {
  issueId: string;
};

export const Reviewers: FC<Props> = ({ issueId }) => {
  const { data: issue, refetch } = useQuery<
    Issue & {
      weakReviewers: User[];
      strongReviewers: User[];
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
    validate: {
      type: (value) => {
        const parsed = z.enum(["weak", "strong"]).safeParse(value);
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
        refetch();
        form.setValues({});
        form.reset();
      },
    });
  };

  if (!issue || !users) return null;

  return (
    <>
      <p>
        Reviewers(weak):{" "}
        {issue.weakReviewers.map((user) => user.name).join(", ")}
      </p>
      <p>
        Reviewers(strong):{" "}
        {issue.strongReviewers.map((user) => user.name).join(", ")}
      </p>
      {canChangeStatus(issue.status) && (
        <form onSubmit={form.onSubmit(onSubmit)}>
          <Select
            label="Type"
            data={[
              { value: "weak", label: "Weak" },
              { value: "strong", label: "Strong" },
            ]}
            {...form.getInputProps("type")}
          />
          <Select
            label="User ID"
            data={(users ?? []).map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            {...form.getInputProps("userId")}
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
    </>
  );
};
