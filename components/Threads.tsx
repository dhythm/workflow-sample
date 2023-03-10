import { Button, Paper, Select, Space, TextInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Thread, Comment, User } from "@prisma/client";
import { FC } from "react";
import { useMutation, useQuery } from "react-query";
import { z } from "zod";

type Inputs = {
  userId: string;
  content: string;
};

type Props = {
  issueId: string;
};

export const Threads: FC<Props> = ({ issueId }) => {
  const { data: threads, refetch } = useQuery<
    (Thread & { comments: Comment[] })[]
  >("threads", async () => {
    const res = await fetch(`/api/issue/${issueId}/threads`);
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
      userId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      content: (value) => {
        const parsed = z.string().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
    },
  });

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${issueId}/thread`, {
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

  if (!threads) return null;

  return (
    <>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Select
          label="User ID"
          data={(users ?? []).map((user) => ({
            value: user.id,
            label: user.name ?? "",
          }))}
          {...form.getInputProps("userId")}
        />
        <TextInput
          label="Title"
          withAsterisk
          {...form.getInputProps("title")}
        />
        <Space h="sm" />
        <Button
          type="submit"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan" }}
        >
          Create Thread
        </Button>
      </form>

      {threads.map((thread) => (
        <Paper key={thread.id} withBorder radius="md">
          <div>
            <Text fz="sm">{thread.comments[0].user.name}</Text>
            <Text fz="xs" c="dimmed">
              {new Date(thread.comments[0].createdAt).toLocaleString("ja-JP")}
            </Text>
          </div>
        </Paper>
      ))}
    </>
  );
};
