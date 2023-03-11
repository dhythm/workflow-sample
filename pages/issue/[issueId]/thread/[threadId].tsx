import { Thread, Comment, User } from "@prisma/client";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "react-query";
import {
  Box,
  Button,
  Group,
  Paper,
  rem,
  Select,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { z } from "zod";

type Inputs = {
  userId: string;
  content: string;
};

export default function ThreadDetailsPage() {
  const router = useRouter();
  const { issueId, threadId } = router.query;

  const { data: thread, refetch } = useQuery<
    Thread & { comments: (Comment & { user: User })[] }
  >(
    "thread",
    async () => {
      const res = await fetch(`/api/issue/${issueId}/thread/${threadId}`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    { enabled: router.isReady }
  );

  const { data: users } = useQuery<User[]>("users", async () => {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  const form = useForm<Inputs>({
    initialValues: {
      userId: "",
      content: "",
    },
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
    const res = await fetch(
      `/api/issue/${issueId}/thread/${threadId}/comment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const onSubmit = (data: Inputs) => {
    mutation.mutate(data, {
      onSuccess: () => {
        refetch();
        form.reset();
      },
    });
  };

  if (!thread || !users) return null;

  return (
    <Box sx={{ padding: "0 24px" }}>
      <h2>Reply Comments</h2>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            rowGap: 8,
          }}
        >
          <SimpleGrid cols={2} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
            <Select
              label="User"
              data={users.map((user) => ({
                value: user.id,
                label: user.name ?? "",
              }))}
              {...form.getInputProps("userId")}
            />
          </SimpleGrid>
          <TextInput
            label="Content"
            withAsterisk
            {...form.getInputProps("content")}
          />
          <Group position="left" mt="sm">
            <Button
              type="submit"
              variant="gradient"
              gradient={{ from: "indigo", to: "cyan" }}
            >
              Reply
            </Button>
          </Group>
        </Box>
      </form>

      {thread.comments.map((comment) => (
        <Paper key={comment.id} withBorder radius="md" mt="md" p="md">
          <Group position="apart">
            <Text size="sm">{comment.user.name}</Text>
            <Text size="xs">
              {new Date(comment.createdAt).toLocaleString("ja-JP")}
            </Text>
          </Group>
          <Text size="sm">{comment.content}</Text>
        </Paper>
      ))}
    </Box>
  );
}
