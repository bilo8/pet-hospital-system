import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function UsersPage() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [type, setType] = useState("RECEPTIONIST");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    specialization: "",
    phone: "",
  });

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createUser = async (e) => {
    e.preventDefault();

    if (type === "RECEPTIONIST") {
      await api.post("/users/receptionist", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
    } else {
      await api.post("/users/doctor", form);
    }

    setForm({
      full_name: "",
      email: "",
      password: "",
      specialization: "",
      phone: "",
    });

    loadUsers();
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout title="Users Management">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Create User</h3>

          <form onSubmit={createUser} className="space-y-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="DOCTOR">Doctor</option>
            </select>

            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

            {type === "DOCTOR" && (
              <>
                <input
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="Specialization"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </>
            )}

            <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
              Create
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">All Users</h3>

          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">{user.full_name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3">
                      {user.id !== currentUser.id ? (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-gray-400">Current user</span>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-3 text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UsersPage;