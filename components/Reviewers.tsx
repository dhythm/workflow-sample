import { FC } from "react";
import { Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { SubmitHandler, useForm } from "react-hook-form";
import { canChangeStatus } from "@/utils/issue-valicator";

type Inputs = {
  type: "weak" | "strong";
  userId: string;
};

type Props = {
  issueId: string;
};

export const Reviewers: FC<Props> = ({ issueId }) => {
  const { data: issue, refetch } = useQuery<
    Issue & {
      weakReviewers: User[];
      strongReviewers: User[];
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

  const { register, handleSubmit, reset } = useForm<Inputs>();

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const res = await fetch(`/api/issue/${issueId}/reviewer`, {
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

  if (!issue || !users) return null;

  return (
    <>
      <p>
        Reviewers(weak):{" "}
        {issue.weakReviewers.map((user) => user.name).join(", ")}
      </p>
      <p>
        Reviewers(strong):{" "}
        {issue.strongReviewers.map((user) => user.name).join(", ")}
      </p>
      {canChangeStatus(issue.status) && (
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
            <select {...register("userId")}>
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
    </>
  );
};
