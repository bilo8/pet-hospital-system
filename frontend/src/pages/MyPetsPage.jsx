import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function MyPetsPage() {
  const token = localStorage.getItem("token");

  const [pets, setPets] = useState([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    gender: "Male",
    pet_image: null,
  });

  const loadPets = () => {
    axios
      .get("http://192.168.1.105:5000/api/dropdowns/pets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setPets(res.data));
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === "pet_image") {
      setForm({
        ...form,
        pet_image: e.target.files[0],
      });
    } else {
      setForm({
        ...form,
        [e.target.name]: e.target.value,
      });
    }
  };

  const addPet = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    await axios.post(
      "http://192.168.1.105:5000/api/client-pets/my-pets",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setMessage("Pet added successfully");
    setShowForm(false);

    setForm({
      name: "",
      type: "",
      breed: "",
      age: "",
      gender: "Male",
      pet_image: null,
    });

    e.target.reset();
    loadPets();
  };

  return (
    <DashboardLayout title="My Pets">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-2xl shadow">
          <div>
            <h3 className="text-xl font-bold">My Pets</h3>
            <p className="text-gray-500">View and manage your pets.</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-800"
          >
            + Add Pet
          </button>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">
                Add New Pet
              </h3>

              <form onSubmit={addPet} className="space-y-3">
                <input
                  name="name"
                  value={form.name}
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
                  <option value="">Select type</option>
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

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:w-1/2 border border-gray-400 py-2 rounded-lg"
                  >
                    Cancel
                  </button>

                  <button className="w-full sm:w-1/2 bg-blue-700 text-white py-2 rounded-lg font-semibold">
                    Save Pet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-2xl shadow p-5">
              {pet.image_url ? (
                <img
                  src={`http://192.168.1.105:5000${pet.image_url}`}
                  alt={pet.name}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-5xl mb-4">
                  🐾
                </div>
              )}

              <h3 className="text-xl font-bold">{pet.name}</h3>
              <p className="text-gray-600">Type: {pet.type}</p>
              <p className="text-gray-600">Breed: {pet.breed || "-"}</p>
              <p className="text-gray-600">Age: {pet.age || "-"}</p>
              <p className="text-gray-600">Gender: {pet.gender || "-"}</p>
            </div>
          ))}

          {pets.length === 0 && (
            <div className="bg-white p-6 rounded-2xl shadow text-gray-500">
              No pets found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MyPetsPage;