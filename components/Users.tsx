import { Async } from "react-async";

const fetchUser = async () => {
  const res = await fetch("/api/user");
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

export const Users = () => {
  return (
    <Async promiseFn={fetchUser}>
      <Async.Pending>Loading...</Async.Pending>
      <Async.Rejected>
        {(error) => <>Something wrong: {error.message}</>}
      </Async.Rejected>
      <Async.Fulfilled>{(data) => {
        return (
          <ul>
            {data.users.map(user => (
              <li key={user.id}>
                {user.name}: {user.email}
              </li>
            )) }
          </ul>
        )
      }}</Async.Fulfilled>
    </Async>
  )
};
