// src/UsersPage.jsx
import { Container, Title } from "@mantine/core";
import UsersTable from "./UsersTable";

export default function UsersPage() {
  return (
    <Container>
      <Title order={2} mb="md">
        Users
      </Title>
      <UsersTable />
    </Container>
  );
}
