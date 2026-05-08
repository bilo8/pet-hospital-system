import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function ReceptionistDashboard() {
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    pendingRegistrations: 0,
    todayAppointments: 0,
    unpaidBills: 0,
    scheduledVideos: 0,
  });

  useEffect(() => {
    axios
      .get("http://192.168.1.105:5000/api/stats/receptionist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setStats(res.data));
  }, []);

  return (
    <DashboardLayout title="Receptionist Dashboard">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title="Pending Registrations" value={stats.pendingRegistrations} />
          <Card title="Today's Appointments" value={stats.todayAppointments} />
          <Card title="Unpaid Bills" value={stats.unpaidBills} />
          <Card title="Scheduled Videos" value={stats.scheduledVideos} />
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <ActionLink
              to="/receptionist/temporary-registrations"
              label="Temporary Registrations"
              color="bg-orange-500"
            />

            <ActionLink
              to="/receptionist/clients-pets"
              label="Clients & Pets"
              color="bg-blue-700"
            />

            <ActionLink
              to="/receptionist/appointments"
              label="Appointments"
              color="bg-green-600"
            />

            <ActionLink
              to="/receptionist/bills"
              label="Bills"
              color="bg-purple-600"
            />

            <ActionLink
              to="/receptionist/video-consultations"
              label="Video Consultations"
              color="bg-teal-600"
            />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold">Daily Responsibilities</h3>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Responsibility text="Confirm verified temporary registrations when clients visit the hospital." />
            <Responsibility text="Register new clients and pets from the reception desk." />
            <Responsibility text="Book, confirm, cancel, or update appointments." />
            <Responsibility text="Create bills and manage cash or online payments." />
            <Responsibility text="Create video consultation links for remote appointments." />
            <Responsibility text="Help clients with account access and profile information." />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow">
      <h3 className="font-bold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-blue-700 mt-2">{value}</p>
    </div>
  );
}

function ActionLink({ to, label, color }) {
  return (
    <Link
      to={to}
      className={`${color} text-white px-4 py-3 rounded-lg text-center font-semibold hover:opacity-90`}
    >
      {label}
    </Link>
  );
}

function Responsibility({ text }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-4 text-gray-700">
      {text}
    </div>
  );
}

export default ReceptionistDashboard;