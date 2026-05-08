import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function PublicRegisterPage() {
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    pet_name: "",
    type: "",
    breed: "",
    age: "",
    gender: "Male",
    preferred_date: "",
    reason: "",
    pet_image: null,
  });

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

  const submitRequest = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      if (form.preferred_date) {
        formData.set(
          "preferred_date",
          form.preferred_date.replace("T", " ") + ":00"
        );
      }

      const res = await axios.post(
        "http://192.168.1.105:5000/api/temporary-registrations",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message);

      setForm({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        pet_name: "",
        type: "",
        breed: "",
        age: "",
        gender: "Male",
        preferred_date: "",
        reason: "",
        pet_image: null,
      });

      e.target.reset();
    } catch (err) {
      alert(
        (err.response?.data?.message || "Request failed") +
          "\n\n" +
          (err.response?.data?.error || "")
      );
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Request Registration
            </h1>

            <p className="text-gray-500 mt-1">
              Fill your information. Verify your email, then visit the hospital
              to confirm registration.
            </p>
          </div>

          <Link to="/" className="text-blue-700 font-semibold">
            Home
          </Link>
        </div>

        {message && (
          <div className="mb-5 bg-green-100 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        <form
          onSubmit={submitRequest}
          className="grid md:grid-cols-2 gap-4"
        >
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full name"
            className="border rounded-lg px-3 py-2"
            required
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border rounded-lg px-3 py-2"
            required
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="border rounded-lg px-3 py-2"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="border rounded-lg px-3 py-2"
          />

          <input
            name="pet_name"
            value={form.pet_name}
            onChange={handleChange}
            placeholder="Pet name"
            className="border rounded-lg px-3 py-2"
            required
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
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
            className="border rounded-lg px-3 py-2"
          />

          <input
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
            placeholder="Age"
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            name="preferred_date"
            type="datetime-local"
            value={form.preferred_date}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          />

          <input
            name="pet_image"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 md:col-span-2"
          />

          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Reason for visit"
            className="border rounded-lg px-3 py-2 md:col-span-2"
          />

          <button className="md:col-span-2 bg-blue-700 text-white py-2 rounded-lg font-semibold">
            Send Request
          </button>
        </form>
      </div>
    </div>
  );
}

export default PublicRegisterPage;