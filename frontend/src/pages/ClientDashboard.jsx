import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function ClientDashboard() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState({
    pets: [],
    appointments: [],
    stats: {
      pets: 0,
      appointments: 0,
      unpaidBills: 0,
      videoConsultations: 0,
    },
  });

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/client-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setData(res.data));
  }, []);

  return (
    <DashboardLayout title="Client Dashboard">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card title="My Pets" value={data.stats.pets} />
          <Card title="Appointments" value={data.stats.appointments} />
          <Card title="Unpaid Bills" value={data.stats.unpaidBills} />
          <Card title="Video Consultations" value={data.stats.videoConsultations} />
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/client/book-appointment"
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-center"
            >
              Book Appointment
            </Link>

            <Link
              to="/client/pets"
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-center"
            >
              My Pets
            </Link>

            <Link
              to="/client/bills"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-center"
            >
              Pay Bills
            </Link>

            <Link
              to="/client/medical-records"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-center"
            >
              Medical Records
            </Link>

            <Link
              to="/client/video-consultations"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center"
            >
              Video Consultations
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">My Pets</h3>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.pets.map((pet) => (
              <div key={pet.id} className="border rounded-2xl p-4 bg-gray-50">
                {pet.image_url ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${pet.image_url}`}
                    alt={pet.name}
                    className="w-full h-40 object-cover rounded-xl mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-5xl mb-3">
                    🐾
                  </div>
                )}

                <h4 className="text-lg font-bold">{pet.name}</h4>
                <p className="text-gray-600">Type: {pet.type}</p>
                <p className="text-gray-600">Breed: {pet.breed || "-"}</p>
                <p className="text-gray-600">Age: {pet.age || "-"}</p>
                <p className="text-gray-600">Gender: {pet.gender || "-"}</p>
              </div>
            ))}

            {data.pets.length === 0 && (
              <p className="text-gray-500">No pets found.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4">Recent Appointments</h3>

          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Pet</th>
                  <th className="p-3 text-left">Doctor</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {data.appointments.map((app) => (
                  <tr key={app.id} className="border-t">
                    <td className="p-3">
                      {new Date(app.appointment_date).toLocaleString()}
                    </td>
                    <td className="p-3">{app.pet_name}</td>
                    <td className="p-3">{app.doctor_name}</td>
                    <td className="p-3">{app.reason}</td>
                    <td className="p-3">{app.status}</td>
                  </tr>
                ))}

                {data.appointments.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-3 text-gray-500">
                      No appointments found.
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

function Card({ title, value }) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow">
      <h3 className="font-bold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-blue-700 mt-2">{value}</p>
    </div>
  );
}

export default ClientDashboard;