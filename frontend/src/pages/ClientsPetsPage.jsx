import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function ClientsPetsPage() {
  const [clientsPets, setClientsPets] = useState([]);
  const [message, setMessage] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
  });

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    pet_name: "",
    type: "",
    breed: "",
    age: "",
    gender: "Male",
    pet_image: null,
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    pet_name: "",
    type: "",
    breed: "",
    age: "",
    gender: "Male",
    pet_image: null,
  });

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadClientsPets = async () => {
    const res = await api.get("/client-pets");
    setClientsPets(res.data);
  };

  useEffect(() => {
    loadClientsPets();
  }, []);

  const filteredClientsPets = useMemo(() => {
    return clientsPets.filter((item) => {
      const search = filters.search.toLowerCase();

      const matchesSearch =
        item.full_name?.toLowerCase().includes(search) ||
        item.email?.toLowerCase().includes(search) ||
        item.phone?.toLowerCase().includes(search) ||
        item.pet_name?.toLowerCase().includes(search) ||
        item.breed?.toLowerCase().includes(search);

      const matchesType = filters.type ? item.type === filters.type : true;

      return matchesSearch && matchesType;
    });
  }, [clientsPets, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
    });
  };

  const handleChange = (e) => {
    if (e.target.name === "pet_image") {
      setForm({ ...form, pet_image: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleEditChange = (e) => {
    if (e.target.name === "pet_image") {
      setEditForm({ ...editForm, pet_image: e.target.files[0] });
    } else {
      setEditForm({ ...editForm, [e.target.name]: e.target.value });
    }
  };

  const registerClientPet = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      await api.post("/client-pets/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Client and pet registered successfully");

      setForm({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        pet_name: "",
        type: "",
        breed: "",
        age: "",
        gender: "Male",
        pet_image: null,
      });

      e.target.reset();
      loadClientsPets();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);

    setEditForm({
      full_name: item.full_name || "",
      phone: item.phone || "",
      address: item.address || "",
      pet_name: item.pet_name || "",
      type: item.type || "",
      breed: item.breed || "",
      age: item.age || "",
      gender: item.gender || "Male",
      pet_image: null,
    });
  };

  const updateClientPet = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(editForm).forEach((key) => {
      if (editForm[key] !== null && editForm[key] !== "") {
        formData.append(key, editForm[key]);
      }
    });

    await api.put(
      `/client-pets/${editingItem.client_id}/pets/${editingItem.pet_id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setEditingItem(null);
    setMessage("Client and pet updated successfully");
    loadClientsPets();
  };

  return (
    <DashboardLayout title="Clients & Pets">
      <div className="space-y-6">
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <h3 className="text-xl font-bold mb-4">Register Client + Pet</h3>

            {message && (
              <div className="mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                {message}
              </div>
            )}

            <form onSubmit={registerClientPet} className="space-y-3">
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Client full name"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Client email"
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

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full border rounded-lg px-3 py-2"
              />

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                className="w-full border rounded-lg px-3 py-2"
              />

              <hr />

              <input
                name="pet_name"
                value={form.pet_name}
                onChange={handleChange}
                placeholder="Pet name"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select pet type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>

              <input
                name="breed"
                value={form.breed}
                onChange={handleChange}
                placeholder="Breed"
                className="w-full border rounded-lg px-3 py-2"
              />

              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                className="w-full border rounded-lg px-3 py-2"
              />

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <input
                name="pet_image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

              <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
                Register
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold">Clients and Pets</h3>
                <p className="text-sm text-gray-500">
                  {filteredClientsPets.length} result(s)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
                <input
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Search client, pet, email..."
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                >
                  <option value="">All Types</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Other">Other</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="border border-gray-400 rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="md:hidden space-y-4">
              {filteredClientsPets.map((item) => (
                <ClientPetCard
                  key={`${item.client_id}-${item.pet_id}`}
                  item={item}
                  onEdit={openEditModal}
                />
              ))}

              {filteredClientsPets.length === 0 && (
                <div className="text-gray-500">No clients or pets found.</div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[1100px] w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Address</th>
                    <th className="p-3 text-left">Pet</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Breed</th>
                    <th className="p-3 text-left">Age</th>
                    <th className="p-3 text-left">Gender</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClientsPets.map((item) => (
                    <tr
                      key={`${item.client_id}-${item.pet_id}`}
                      className="border-t"
                    >
                      <td className="p-3">
                        {item.image_url ? (
                          <img
                            src={`http://192.168.1.105:5000${item.image_url}`}
                            alt={item.pet_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      <td className="p-3">{item.full_name}</td>
                      <td className="p-3">{item.email}</td>
                      <td className="p-3">{item.phone}</td>
                      <td className="p-3">{item.address}</td>
                      <td className="p-3">{item.pet_name}</td>
                      <td className="p-3">{item.type}</td>
                      <td className="p-3">{item.breed || "-"}</td>
                      <td className="p-3">{item.age || "-"}</td>
                      <td className="p-3">{item.gender}</td>
                      <td className="p-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredClientsPets.length === 0 && (
                    <tr>
                      <td colSpan="11" className="p-3 text-gray-500">
                        No clients or pets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">
                Edit Client & Pet
              </h3>

              <form onSubmit={updateClientPet} className="space-y-3">
                <input
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  placeholder="Client full name"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />

                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  placeholder="Phone"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  placeholder="Address"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <hr />

                <input
                  name="pet_name"
                  value={editForm.pet_name}
                  onChange={handleEditChange}
                  placeholder="Pet name"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />

                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select pet type</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  name="breed"
                  value={editForm.breed}
                  onChange={handleEditChange}
                  placeholder="Breed"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <input
                  name="age"
                  type="number"
                  value={editForm.age}
                  onChange={handleEditChange}
                  placeholder="Age"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <input
                  name="pet_image"
                  type="file"
                  accept="image/*"
                  onChange={handleEditChange}
                  className="w-full border rounded-lg px-3 py-2"
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="w-full sm:w-1/2 border border-gray-400 py-2 rounded-lg"
                  >
                    Cancel
                  </button>

                  <button className="w-full sm:w-1/2 bg-blue-700 text-white py-2 rounded-lg font-semibold">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ClientPetCard({ item, onEdit }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <div className="flex gap-4">
        {item.image_url ? (
          <img
            src={`http://192.168.1.105:5000${item.image_url}`}
            alt={item.pet_name}
            className="w-20 h-20 object-cover rounded-xl"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
            🐾
          </div>
        )}

        <div className="flex-1">
          <h4 className="font-bold text-lg">{item.pet_name}</h4>
          <p className="text-sm text-gray-600">
            {item.type} {item.breed ? `- ${item.breed}` : ""}
          </p>
          <p className="text-sm text-gray-600">
            Age: {item.age || "-"} | Gender: {item.gender || "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700 space-y-1">
        <p>
          <span className="font-semibold">Client:</span> {item.full_name}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {item.email}
        </p>
        <p>
          <span className="font-semibold">Phone:</span> {item.phone || "-"}
        </p>
        <p>
          <span className="font-semibold">Address:</span> {item.address || "-"}
        </p>
      </div>

      <button
        onClick={() => onEdit(item)}
        className="mt-4 w-full bg-blue-700 text-white py-2 rounded-lg"
      >
        Edit
      </button>
    </div>
  );
}

export default ClientsPetsPage;