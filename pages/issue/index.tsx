import { Issue, User } from "@prisma/client";
import { useQuery } from "react-query";
// import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { useForm } from "@mantine/form";
import Link from "next/link";
import {
  Box,
  Button,
  Group,
  Select,
  TextInput,
  Text,
  UnstyledButton,
  createStyles,
  SimpleGrid,
  Space,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { z } from "zod";

type Inputs = {
  title: string;
  content: string;
  authorId: string;
  assigneeId: string;
};

export default function IssuesPage() {
  const { classes } = useStyles();
  const { data: issues, refetch } = useQuery<
    (Issue & {
      author: User;
      assignee: User;
      reviewers: User[];
      approvers: User[];
    })[]
  >("issues", async () => {
    const res = await fetch("/api/issue");
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
      title: "",
      content: "",
      authorId: "",
      assigneeId: "",
    },
    validate: {
      title: (value) => {
        const parsed = z.string().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      content: (value) => {
        const parsed = z.string().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      authorId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      assigneeId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
    },
  });
  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch("/api/issue", {
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
        form.reset();
      },
    });
  };

  if (!users || !issues) return null;

  return (
    <Box sx={{ padding: "0 24px" }}>
      <h2>Create Issue</h2>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            rowGap: 8,
          }}
        >
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
          <SimpleGrid cols={2} breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
            <Select
              label="Author"
              data={users.map((user) => ({
                value: user.id,
                label: user.name ?? "",
              }))}
              withAsterisk
              {...form.getInputProps("authorId")}
            />
            <Select
              label="Assignee"
              data={users.map((user) => ({
                value: user.id,
                label: user.name ?? "",
              }))}
              withAsterisk
              {...form.getInputProps("assigneeId")}
            />
          </SimpleGrid>
          <Group position="center" mt="xl" mb="xl">
            <Button
              type="submit"
              variant="gradient"
              size="md"
              gradient={{ from: "indigo", to: "cyan" }}
            >
              Create
            </Button>
          </Group>
        </Box>
      </form>

      <h2>Issues</h2>
      {issues.map((issue) => (
        <UnstyledButton key={issue.id} className={classes.issue}>
          <Link href={`/issue/${issue.id}`}>
            <Group noWrap>
              <div style={{ flex: 1 }}>
                <Text fz="lg" fw={700}>
                  {issue.title}
                </Text>
                <Text fz="xs" c="dimmed">
                  {issue.author.name}
                </Text>
                <Text fz="xs" c="dimmed">
                  {new Date(issue.createdAt).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Text>
              </div>

              <IconChevronRight size="0.9rem" stroke={1.5} />
            </Group>
          </Link>
        </UnstyledButton>
      ))}
    </Box>
  );
}

const useStyles = createStyles((theme) => ({
  issue: {
    display: "block",
    width: "100%",
    padding: theme.spacing.md,
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[8]
          : theme.colors.gray[0],
    },
  },
}));
