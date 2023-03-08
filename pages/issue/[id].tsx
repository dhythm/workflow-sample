import { Approvals } from "@/components/Approvals";
import { Comments } from "@/components/Comments";
import { Issue, User, Comment } from "@prisma/client";
import { useRouter } from "next/router";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";

type Inputs = {
  type: "weak" | "strong";
  reviewerId: string;
};

export default function IssueDetailsPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>();

  const { id } = router.query;
  const { data: issue, refetch } = useQuery<
    Issue & {
      author: User;
      assignee: User;
      weakReviewers: User[];
      strongReviewers: User[];
      approvedBy: User[];
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
  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${id}/reviewer`, {
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

  if (typeof id !== 'string') return null

  return (
    <>
      {issue && (
        <div>
          <p>Title : {issue.title}</p>
          <p>Content : {issue.content}</p>
          <p>Author : {issue.author.name}</p>
          <p>Assignee : {issue.assignee?.name}</p>
          <p>
            Reviewers(weak):{" "}
            {issue.weakReviewers.map((user) => user.name).join(", ")}
          </p>
          <p>
            Reviewers(strong):{" "}
            {issue.strongReviewers.map((user) => user.name).join(", ")}
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <select {...register("type")}>
                <option key="weak" value="weak">
                  Weak
                </option>
                <option key="strong" value="strong">
                  Strong
                </option>
              </select>
              <select {...register("reviewerId")}>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <input type="submit" />
          </form>
          <hr />
          <Approvals issueId={id} />
          <Comments issueId={id} />
        </div>
      )}
    </>
  );
}
