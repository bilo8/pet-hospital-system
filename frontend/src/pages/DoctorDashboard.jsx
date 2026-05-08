import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function DoctorDashboard() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState({
    todayAppointments: [],
    recentAppointments: [],
    stats: {
      totalAppointments: 0,
      todayAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
    },
  });

  useEffect(() => {
    axios
      .get("http://192.168.1.105:5000/api/doctor-dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setData(res.data));
  }, []);

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title="Total Appointments" value={data.stats.totalAppointments} />
          <Card title="Today's Appointments" value={data.stats.todayAppointments} />
          <Card title="Pending" value={data.stats.pendingAppointments} />
          <Card title="Completed" value={data.stats.completedAppointments} />
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/doctor/appointments"
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-center"
            >
              View Appointments
            </Link>

            <Link
              to="/doctor/medical-records"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-center"
            >
              Add Medical Record
            </Link>

            <Link
              to="/doctor/video-consultations"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center"
            >
              Video Consultations
            </Link>
          </div>
        </div>

        <AppointmentTable
          title="Today's Appointments"
          appointments={data.todayAppointments}
        />

        <AppointmentTable
          title="Recent Appointments"
          appointments={data.recentAppointments}
        />
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

function AppointmentTable({ title, appointments }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="min-w-[850px] w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Pet</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((app) => (
              <tr key={app.id} className="border-t">
                <td className="p-3">
                  {new Date(app.appointment_date).toLocaleString()}
                </td>
                <td className="p-3">{app.client_name}</td>
                <td className="p-3">{app.pet_name}</td>
                <td className="p-3">{app.pet_type}</td>
                <td className="p-3">{app.reason}</td>
                <td className="p-3">{app.status}</td>
              </tr>
            ))}

            {appointments.length === 0 && (
              <tr>
                <td colSpan="6" className="p-3 text-gray-500">
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DoctorDashboard;