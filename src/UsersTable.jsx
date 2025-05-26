import React, { useMemo, useState } from "react";
import {
  Table,
  TextInput,
  Button,
  Loader,
  Center,
  Pagination,
  Group,
  Modal,
} from "@mantine/core";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// API helpers
const fetchUsers = async ({ page, pageSize, search, sorting }) => {
  const url = new URL("http://localhost:5000/api/users");
  url.searchParams.set("page", page);
  url.searchParams.set("limit", pageSize);
  if (search) url.searchParams.set("search", search);
  if (sorting.length > 0) {
    const { id: sortField, desc } = sorting[0];
    url.searchParams.set("sort", sortField);
    url.searchParams.set("order", desc ? "desc" : "asc");
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  return { data: json.data, totalCount: json.meta.total };
};

const deleteUser = async (id) => {
  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
};

const addUser = async (user) => {
  const res = await fetch(`http://localhost:5000/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to add user");
  return res.json();
};

const updateUser = async ({ id, name, email }) => {
  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
};

export default function UsersTable() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formUser, setFormUser] = useState({ id: null, name: "", email: "" });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", page, pageSize, globalFilter, sorting],
    queryFn: () =>
      fetchUsers({ page, pageSize, search: globalFilter, sorting }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const addMutation = useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setAddModalOpen(false);
      setFormUser({ id: null, name: "", email: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setEditModalOpen(false);
      setFormUser({ id: null, name: "", email: "" });
    },
  });

  const columns = useMemo(
    () => [
      { header: "ID", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setFormUser(row.original);
                setEditModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="xs"
              color="red"
              onClick={() => deleteMutation.mutate(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil((data?.totalCount || 0) / pageSize),
  });

  if (isLoading)
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  if (isError)
    return (
      <Center py="xl" color="red">
        Error: {error.message}
      </Center>
    );

  return (
    <>
      <Group position="apart" mb="md">
        <TextInput
          placeholder="Search users"
          value={globalFilter}
          onChange={(e) => {
            setPage(1);
            setGlobalFilter(e.currentTarget.value);
          }}
          style={{ flex: 1 }}
        />
        <Button onClick={() => setAddModalOpen(true)}>Add User</Button>
      </Group>

      <Table striped highlightOnHover>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{ asc: " 🔼", desc: " 🔽" }[
                    header.column.getIsSorted() ?? ""
                  ]}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      <Center mt="md">
        <Pagination
          total={Math.ceil((data?.totalCount || 0) / pageSize)}
          page={page}
          onChange={setPage}
        />
      </Center>

      {/* Add User Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New User"
      >
        <TextInput
          label="ID"
          type="number"
          value={formUser.id ?? ""}
          onChange={(e) =>
            setFormUser({ ...formUser, id: Number(e.currentTarget.value) })
          }
          mb="sm"
        />
        <TextInput
          label="Name"
          value={formUser.name}
          onChange={(e) =>
            setFormUser({ ...formUser, name: e.currentTarget.value })
          }
          mb="sm"
        />
        <TextInput
          label="Email"
          value={formUser.email}
          onChange={(e) =>
            setFormUser({ ...formUser, email: e.currentTarget.value })
          }
          mb="sm"
        />
        <Group position="right" mt="md">
          <Button
            onClick={() =>
              addMutation.mutate({
                id: formUser.id,
                name: formUser.name,
                email: formUser.email,
              })
            }
            loading={addMutation.isLoading}
          >
            Add
          </Button>
        </Group>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
      >
        <TextInput
          label="Name"
          value={formUser.name}
          onChange={(e) =>
            setFormUser({ ...formUser, name: e.currentTarget.value })
          }
          mb="sm"
        />
        <TextInput
          label="Email"
          value={formUser.email}
          onChange={(e) =>
            setFormUser({ ...formUser, email: e.currentTarget.value })
          }
          mb="sm"
        />
        <Group position="right" mt="md">
          <Button
            onClick={() => updateMutation.mutate(formUser)}
            loading={updateMutation.isLoading}
          >
            Save
          </Button>
        </Group>
      </Modal>
    </>
  );
}
