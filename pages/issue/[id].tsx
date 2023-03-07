import { Issue, User } from "@prisma/client";
import { useRouter } from "next/router";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";

type Inputs = {
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
  const { data: issueData, refetch } = useQuery<{
    issue: Issue & { author: User; assignee: User; reviewers: User[] };
  }>(
    "issue",
    async () => {
      const res = await fetch(`/api/issue/${id}`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    },
    { enabled: router.isReady }
  );
  const { data: userData } = useQuery<{ users: User[] }>("users", async () => {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const mutation = useMutation<Inputs>(async (data) => {
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

  return (
    <>
      {issueData && (
        <div>
          <p>Title : {issueData.issue.title}</p>
          <p>Content : {issueData.issue.content}</p>
          <p>Author : {issueData.issue.author.name}</p>
          <p>Assignee : {issueData.issue.assignee?.name}</p>
          <p>
            Reviewers:{" "}
            {issueData.issue.reviewers.map((user) => user.name).join(", ")}
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <select {...register("reviewerId")}>
                {userData?.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <input type="submit" />
          </form>
        </div>
      )}
    </>
  );
}
