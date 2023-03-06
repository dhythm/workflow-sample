import { Issue } from "@prisma/client";
import { useQuery } from "react-query";

export default function IssuesPage() {
  const { data, error, isLoading } = useQuery<{ issues: Issue[] }>(
    "issues",
    async () => {
      const res = await fetch("/api/issue");
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );

  return (
    <>
      <h1>IssuesPage</h1>
      <ul>
        {data?.issues.map((issue) => (
          <li key={issue.id}>{issue.title}</li>
        ))}
      </ul>
    </>
  );
}
