import { Issue, User } from "@prisma/client";
import { useQuery } from "react-query";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import Link from "next/link";
import {
  Box,
  Button,
  Group,
  Select,
  Space,
  TextInput,
  Text,
  Paper,
  UnstyledButton,
  createStyles,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";

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
      weakReviewers: User[];
      strongReviewers: User[];
      approvedBy: User[];
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>();
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
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    mutation.mutate(data, {
      onSuccess: () => {
        reset();
        refetch();
      },
    });
  };

  if (!users || !issues) return null;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            rowGap: 8,
            padding: 24,
          }}
        >
          <TextInput
            {...register("title", { required: true })}
            label="Title"
            withAsterisk
            {...(errors.title && { error: "Required" })}
          />
          <TextInput
            {...register("content", { required: true })}
            label="Content"
            withAsterisk
            {...(errors.content && { error: "Required" })}
          />
          <Select
            {...register("authorId", { required: true })}
            label="Author"
            data={users.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            withAsterisk
            {...(errors.authorId && { error: "Required" })}
          />
          <Select
            {...register("assigneeId", { required: true })}
            label="Assignee"
            data={users.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            withAsterisk
            {...(errors.assigneeId && { error: "Required" })}
          />
          <Space h="sm" />
          <Button
            type="submit"
            variant="gradient"
            gradient={{ from: "indigo", to: "cyan" }}
          >
            Create
          </Button>
        </Box>
      </form>

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
    </>
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
