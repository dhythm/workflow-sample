import { FC } from "react";
import { Approval, Comment, Issue, User } from "@prisma/client";
import { useMutation, useQuery } from "react-query";
import { SubmitHandler, useForm } from "react-hook-form";
import { canChangeStatus } from "@/utils/issue-valicator";

type Inputs = {
  userId: string;
  approved: "true" | "false";
};

type Props = {
  issueId: string;
};

export const Approvals: FC<Props> = ({ issueId }) => {
  const { data: issue } = useQuery<
    Issue & { weakReviewers: User[]; strongReviewers: User[] }
  >("issue", async () => {
    const res = await fetch(`/api/issue/${issueId}`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
  const { data: approvals, refetch } = useQuery<(Approval & { user: User })[]>(
    "approvals",
    async () => {
      const res = await fetch(`/api/issue/${issueId}/approval`);
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

  const mutation = useMutation<any, any, Inputs>(async (data) => {
    const { userId } = data;
    const approved = data.approved === "true";
    const res = await fetch(`/api/issue/${issueId}/approval`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, approved }),
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

  if (
    !issue ||
    (issue.weakReviewers.length === 0 && issue.strongReviewers.length === 0)
  )
    return null;

  return (
    <>
      {canChangeStatus(issue.status) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <select {...register("userId", { required: true })}>
              {issue.weakReviewers
                .concat(issue.strongReviewers)
                ?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            {errors.userId && <span>This field is required</span>}
            <select {...register("approved", { required: true })}>
              <option key="approve" value={"true"}>
                Approve
              </option>
              <option key="reject" value={"false"}>
                Reject
              </option>
            </select>
          </div>
          <input type="submit" />
        </form>
      )}
      <div>
        Approved by {approvals
          ?.flatMap((approval) => (approval.approved ? approval.user.name : []))
          .join(", ")}
      </div>
    </>
  );
};
