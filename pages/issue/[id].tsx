import { Approvals } from "@/components/Approvals";
import { Comments } from "@/components/Comments";
import { Reviewers } from "@/components/Reviewers";
import { canChangeStatus } from "@/utils/issue-valicator";
import {
  Badge,
  Button,
  Card,
  createStyles,
  Group,
  rem,
  Select,
  Space,
  Text,
} from "@mantine/core";
import { Issue, User, Comment, IssueStatus } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";

type Inputs = {
  title: string;
  content: string;
  status: IssueStatus;
  assigneeId: string;
};

export default function IssueDetailsPage() {
  const router = useRouter();
  const { classes, theme } = useStyles();

  const { id } = router.query;
  const { data: issue, refetch } = useQuery<
    Issue & {
      author: User;
      assignee: User;
      weakReviewers: User[];
      strongReviewers: User[];
      comments: Comment[];
    }
  >(
    "issue",
    async () => {
      const res = await fetch(`/api/issue/${id}`);
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

  const { register, handleSubmit, reset } = useForm<Inputs>();
  useEffect(() => {
    if (issue) {
      reset({
        status: issue.status,
        assigneeId: issue.assigneeId ?? undefined,
      });
    }
  }, [issue, reset]);

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${id}`, {
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

  if (typeof id !== "string" || !users) return null;

  return (
    <>
      {issue && (
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card withBorder radius="md" p="md" className={classes.card}>
              <Card.Section className={classes.section}>
                <Group position="apart" mt="md">
                  <Text fz="lg" fw={500}>
                    {issue.title}
                  </Text>
                  <Badge size="sm">{issue.status}</Badge>
                </Group>
                <Text fz="sm" mt="xs">
                  {issue.content}
                </Text>
              </Card.Section>
              <Card.Section className={classes.section}>
                <Group position="apart" mt="md">
                  <Text fz="md">{issue.author.name}</Text>
                  <Text fz="md">
                    {new Date(issue.createdAt).toLocaleString("ja-JS")}
                  </Text>
                </Group>
              </Card.Section>
              <Card.Section className={classes.section}>
                <Select
                  {...register("status", { required: true })}
                  label="Status"
                  data={Object.keys(IssueStatus).map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  defaultValue={issue.status}
                  readOnly={!canChangeStatus(issue.status)}
                />
                <Select
                  {...register("assigneeId", { required: true })}
                  label="Assignee"
                  data={users.map((user) => ({
                    value: user.id,
                    label: user.name ?? "",
                  }))}
                  defaultValue={issue.assigneeId}
                  readOnly={!canChangeStatus(issue.status)}
                />
                <Space h="sm" />
                <Button
                  type="submit"
                  variant="gradient"
                  gradient={{ from: "indigo", to: "cyan" }}
                >
                  Update
                </Button>
              </Card.Section>
            </Card>
          </form>
          <hr />
          <Reviewers issueId={id} />
          <hr />
          <Approvals issueId={id} />
          <hr />
          <Comments issueId={id} />
        </div>
      )}
    </>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
  },

  section: {
    borderBottom: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },

  like: {
    color: theme.colors.red[6],
  },

  label: {
    textTransform: "uppercase",
    fontSize: theme.fontSizes.xs,
    fontWeight: 700,
  },
}));
