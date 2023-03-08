import { Approvals } from "@/components/Approvals";
import { Comments } from "@/components/Comments";
import { Reviewers } from "@/components/Reviewers";
import { canChangeStatus } from "@/utils/issue-valicator";
import { Issue, User, Comment, IssueStatus } from "@prisma/client";
import { useRouter } from "next/router";
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

  const { register, handleSubmit, reset } = useForm<Inputs>({ 
    defaultValues: {
    status: issue?.status,
    assigneeId: issue?.assigneeId ?? undefined,
  }});
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
          <p>Title : {issue.title}</p>
          <p>Content : {issue.content}</p>
          <p>Status : {issue.status}</p>
          <p>Author : {issue.author.name}</p>
          <p>Assignee : {issue.assignee?.name}</p>
          {canChangeStatus(issue.status) && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <select {...register("status")}>
                  {Object.keys(IssueStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assigneeId">Assignee:</label>
                <select {...register("assigneeId")}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <input type="submit" />
            </form>
          )}
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
