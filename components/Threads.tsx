import {
  Button,
  Paper,
  Select,
  Space,
  TextInput,
  Text,
  Box,
  SimpleGrid,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Thread, Comment, User } from "@prisma/client";
import { FC } from "react";
import { useMutation, useQuery } from "react-query";
import { z } from "zod";

type Inputs = {
  userId: string;
  title: string;
  content: string;
};

type Props = {
  issueId: string;
  refetch?: () => void;
};

export const Threads: FC<Props> = ({ issueId, refetch }) => {
  const { data: users } = useQuery<User[]>("users", async () => {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

  const form = useForm<Inputs>({
    initialValues: {
      userId: "",
      title: "",
      content: "",
    },
    validate: {
      userId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      title: (value) => {
        const parsed = z.string().safeParse(value);
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
        refetch?.();
        form.reset();
      },
    });
  };

  if (!users) return null;

  return (
    <>
      <h2>Add Comment</h2>
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
              data={(users ?? []).map((user) => ({
                value: user.id,
                label: user.name ?? "",
              }))}
              {...form.getInputProps("userId")}
            />
          </SimpleGrid>
          <TextInput
            label="Title"
            withAsterisk
            {...form.getInputProps("title")}
          />
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
              Add
            </Button>
          </Group>
        </Box>
      </form>
    </>
  );
};
