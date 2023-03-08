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
  } = useForm<Inputs>({
    defaultValues: {
      authorId: users?.[0].id,
      assigneeId: users?.[0].id,
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
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors.authorId && <span>This field is required</span>}
        </div>
        <div>
          <label htmlFor="assigneeId">Assignee:</label>
          <select {...register("assigneeId", { required: true })}>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors.assigneeId && <span>This field is required</span>}
        </div>
        <input type="submit" />
      </form>

      <hr />

      <ul>
        {issues?.map((issue) => (
          <li key={issue.id}>
            <Link href={`/issue/${issue.id}`}>
              {issue.title}, {issue.status}, by {issue.author.name},{" "}
              {issue.createdAt.toString()}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
