import { Issue, User } from "@prisma/client";
import { useQuery } from "react-query";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import Link from "next/link";

type Inputs = {
  title: string;
  content: string;
  authorId: string;
  assigneeId: string;
};



export default function IssuesPage() {
  const { data: issueData, refetch } = useQuery<{ issues: (Issue & { author: User; assignee: User; reviewers: User[] })[] }>(
    "issues",
    async () => {
      const res = await fetch("/api/issue");
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );
  const { data: userData } = useQuery<{ users: User[] }>(
    "users",
    async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>();
  const mutation = useMutation<Inputs>(async (data) => {
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
    mutation.mutate(data, { onSuccess: () => {
      reset()
      refetch()
    }});
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="title">Title:</label>
          <input {...register("title", { required: true })} />
          {errors.title && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="content">Content:</label>
          <input {...register("content", { required: true })} />
          {errors.content && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="authorId">Author:</label>
          <select {...register("authorId", { required: true })}>
            {userData?.users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          {errors.authorId && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="assigneeId">Assignee:</label>
          <select {...register("assigneeId")}>
            {userData?.users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <input type="submit" />
      </form>

      <hr />

      <div>
        {issueData?.issues.map(issue => (
        <div key={issue.id} style={{ padding: 8 }}>
          <p>title    : {issue.title}</p>
          <p>content  : {issue.content}</p>
          <p>author   : {issue.author.name}</p>
          <p>assignee : {issue.assignee?.name ?? ''}</p>
          <p>reviewers: {issue.reviewers.map(reviewer => reviewer.name).join(', ')}</p>
          <Link href={`/issue/${issue.id}`}>See</Link>
        </div>
        ))}

      </div>
    </>
  );
}
