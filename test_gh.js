const token = process.env.GITHUB_TOKEN || "";
async function fetchGH() {
  const query = `
    query($login: String!) {
      repositoryOwner(login: $login) {
        ... on User {
          createdAt
          followers { totalCount }
        }
        ... on Organization {
          createdAt
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "User-Agent": "test",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { login: "facebook" } })
  });
  console.log(await res.json());
}
fetchGH();
