import { Issue, IssueStatus, User } from "@prisma/client";
import { FC, useEffect } from "react";
import { useMutation, useQuery } from "react-query";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { Button, Select, SimpleGrid } from "@mantine/core";
import { canChangeStatus } from "@/utils/issue-valicator";

type Inputs = {
  status: IssueStatus;
  assigneeId: string;
};

type Props = {
  issueId: string;
  refetch?: () => void;
};

export const ChangeIssueStatus: FC<Props> = ({ issueId, refetch }) => {
  const { data: issue } = useQuery<
    Issue & {
      assignee: User;
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

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${issueId}`, {
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
      },
    });
  };

  if (!issue || !users) return null;

  return (
    <div>
      <h2>Update Issue</h2>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <SimpleGrid
          mt="sm"
          cols={2}
          breakpoints={[{ maxWidth: "sm", cols: 1 }]}
        >
          <Select
            label="Status"
            data={Object.keys(IssueStatus).map((status) => ({
              value: status,
              label: status,
            }))}
            withinPortal
            readOnly={!canChangeStatus(issue.status)}
            {...form.getInputProps("status")}
          />
          <Select
            label="Assignee"
            data={users.map((user) => ({
              value: user.id,
              label: user.name ?? "",
            }))}
            withinPortal
            dropdownPosition="bottom"
            readOnly={!canChangeStatus(issue.status)}
            {...form.getInputProps("assigneeId")}
          />
        </SimpleGrid>
        <Button
          mt="md"
          type="submit"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan" }}
        >
          Update
        </Button>
      </form>
    </div>
  );
};
