import { FC } from "react";
import { Comment, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { canChangeStatus } from "@/utils/issue-valicator";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Select, Space, TextInput } from "@mantine/core";

type Inputs = {
  userId: string;
  content: string;
};

type Props = {
  issueId: string;
};

export const Comments: FC<Props> = ({ issueId }) => {
  const { data: comments, refetch } = useQuery<(Comment & { user: User })[]>(
    "comments",
    async () => {
      const res = await fetch(`/api/issue/${issueId}/comment`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );
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
    const res = await fetch(`/api/issue/${issueId}/comment`, {
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

  if (!comments) return null;

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
          Update
        </Button>
      </form>

      {comments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.createdAt.toString()}</p>
          <p>
            {comment.content} by {comment.user.name}
          </p>
        </div>
      ))}
    </>
  );
};
