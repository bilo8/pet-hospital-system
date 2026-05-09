import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function ProfilePage() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    specialization: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadProfile = async () => {
    const res = await api.get("/profile");

    setProfile({
      full_name: res.data.full_name || "",
      email: res.data.email || "",
      role: res.data.role || "",
      phone: res.data.client_phone || res.data.doctor_phone || "",
      address: res.data.address || "",
      specialization: res.data.specialization || "",
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setMessage("");

    await api.put("/profile", profile);

    const updatedUser = {
      ...user,
      full_name: profile.full_name,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setMessage("Profile updated successfully");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    try {
      await api.put("/profile/password", passwordForm);

      setPasswordMessage("Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
    } catch (err) {
      setPasswordMessage(
        err.response?.data?.message || "Password change failed"
      );
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">My Profile</h3>

          {message && (
            <div className="mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
              {message}
            </div>
          )}

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Full Name</label>
              <input
                name="full_name"
                value={profile.full_name}
                onChange={handleProfileChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                value={profile.email}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Role</label>
              <input
                value={profile.role}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            {(profile.role === "CLIENT" || profile.role === "DOCTOR") && (
              <div>
                <label className="block mb-1 font-medium">Phone</label>
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            )}

            {profile.role === "CLIENT" && (
              <div>
                <label className="block mb-1 font-medium">Address</label>
                <input
                  name="address"
                  value={profile.address}
                  onChange={handleProfileChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            )}

            {profile.role === "DOCTOR" && (
              <div>
                <label className="block mb-1 font-medium">Specialization</label>
                <input
                  name="specialization"
                  value={profile.specialization}
                  onChange={handleProfileChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            )}

            <button className="w-full sm:w-auto bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold">
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Change Password</h3>

          {passwordMessage && (
            <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
              {passwordMessage}
            </div>
          )}

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Current Password</label>
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">New Password</label>
              <input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <button className="w-full sm:w-auto bg-green-600 text-white px-5 py-2 rounded-lg font-semibold">
              Change Password
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;