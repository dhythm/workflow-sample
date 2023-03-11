import { Badge, Box, Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { Issue, User, Comment, IssueStatus, Approval } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Threads } from "@/components/Threads";
import { ChangeIssueStatus } from "@/components/ChangeIssueStatus";
import { AddReviewer } from "@/components/AddReviewer";
import { ApproveIssue } from "@/components/ApproveIssue";
import { IconCheck } from "@tabler/icons-react";

type Inputs = {
  status: IssueStatus;
  assigneeId: string;
};

export default function IssueDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: issue, refetch } = useQuery<
    Issue & {
      author: User;
      assignee: User;
      reviewers: User[];
      approvers: User[];
      approvals: Approval[];
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

  const form = useForm<Inputs>({
    validate: {
      status: (value) => {
        const parsed = z.nativeEnum(IssueStatus).safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
      assigneeId: (value) => {
        const parsed = z.string().uuid().safeParse(value);
        return parsed.success ? null : parsed.error.message;
      },
    },
  });
  useEffect(() => {
    if (issue) {
      form.setValues({
        status: issue.status,
        assigneeId: issue.assigneeId ?? undefined,
      });
    }
  }, [issue]);

  if (typeof id !== "string" || !issue || !users) return null;

  return (
    <Box sx={{ padding: "0 24px" }}>
      <div>
        <h2>Issue Details</h2>

        <Paper withBorder p="md" radius="md">
          <Group position="apart">
            <Text fz="xl" fw={700}>
              {issue.title}
            </Text>

            <Badge>{issue.status}</Badge>
          </Group>

          <Text fz="sm" c="dimmed">
            {issue.content}
          </Text>

          <SimpleGrid
            cols={3}
            breakpoints={[{ maxWidth: "xs", cols: 1 }]}
            mt="xl"
          >
            <Box sx={{ borderBottomColor: "" }}>
              <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
                Assignee
              </Text>
              <Text fw={700}>{issue.assignee.name}</Text>
            </Box>
            <Box sx={{ borderBottomColor: "" }}>
              <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
                Author
              </Text>
              <Text fw={700}>{issue.author.name}</Text>
            </Box>
            <Box sx={{ borderBottomColor: "" }}>
              <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
                Created At
              </Text>
              <Text fw={700}>
                {new Date(issue.createdAt).toLocaleString("ja-JS")}
              </Text>
            </Box>
          </SimpleGrid>

          <Text tt="uppercase" fz="xs" c="dimmed" fw={700} mt="md">
            Reviewers
          </Text>
          {[...issue.reviewers, ...issue.approvers].map((user) => {
            const isApprover = issue.approvers.some((u) => u.id === user.id);
            const approved = issue.approvals.some(
              (approval) => approval.userId === user.id
            );
            return (
              <Group key={user.id} position="apart">
                <Group>
                  <Text fz="sm">{user.name}</Text>
                  <Badge size="sm">
                    {isApprover ? "Approver" : "Reviewer"}
                  </Badge>
                </Group>
                {approved && <IconCheck color="green" />}
              </Group>
            );
          })}

          {/* TODO: add Threads of comments*/}
        </Paper>

        <ChangeIssueStatus issueId={id} refetch={refetch} />

        <AddReviewer issueId={id} refetch={refetch} />

        <ApproveIssue issueId={id} refetch={refetch} />

        <Threads issueId={id} refetch={refetch} />
      </div>
    </Box>
  );
}
