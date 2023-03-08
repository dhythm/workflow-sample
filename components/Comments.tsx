import { FC } from "react";
import { Comment, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { SubmitHandler, useForm } from "react-hook-form";

type Inputs = {
  userId: string;
  content: string;
};

type Props = {
  issueId: string;
};

export const Comments: FC<Props> = ({ issueId }) => {
  const { data: comments, refetch } = useQuery<(Comment & { user: User })[]>(
    "comments",
    async () => {
      const res = await fetch(`/api/issue/${issueId}/comment`);
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );
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
    const res = await fetch(`/api/issue/${issueId}/comment`, {
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

  if (!comments) return null;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <select {...register("userId", { required: true })}>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors.userId && <span>This field is required</span>}
          <div>
            <label htmlFor="title">Comment:</label>
            <input {...register("content", { required: true })} />
            {errors.content && <span>This field is required</span>}
          </div>
        </div>
        <input type="submit" />
      </form>
      {comments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.createdAt.toString()}</p>
          <p>{comment.content} by {comment.user.name}</p>
        </div>
      ))}
    </>
  );
};
