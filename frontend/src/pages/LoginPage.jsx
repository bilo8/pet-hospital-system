import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        form,
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;

      if (role === "ADMIN") navigate("/admin");
      else if (role === "RECEPTIONIST") navigate("/receptionist");
      else if (role === "DOCTOR") navigate("/doctor");
      else if (role === "CLIENT") navigate("/client");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-700">Login</h1>

        <p className="text-center text-gray-500 mt-2">
          Access your PetCare Hospital account
        </p>

        {error && (
          <div className="mt-5 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>

          <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800">
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Back to{" "}
          <Link to="/" className="text-blue-700 font-semibold">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
