import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function VideoConsultationsPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [form, setForm] = useState({
    appointment_id: "",
    meeting_link: "",
  });

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadConsultations = async () => {
    const res = await api.get("/video-consultations");
    setConsultations(res.data);
  };

  const loadAppointments = async () => {
    const res = await api.get("/appointments");
    setAppointments(res.data);
  };

  useEffect(() => {
    loadConsultations();

    if (user.role === "ADMIN" || user.role === "RECEPTIONIST") {
      loadAppointments();
    }
  }, []);

  const filteredConsultations = useMemo(() => {
    return consultations.filter((item) => {
      const search = filters.search.toLowerCase();

      const matchesSearch =
        item.pet_name?.toLowerCase().includes(search) ||
        item.client_name?.toLowerCase().includes(search) ||
        item.doctor_name?.toLowerCase().includes(search) ||
        item.reason?.toLowerCase().includes(search);

      const matchesStatus = filters.status
        ? item.status === filters.status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [consultations, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createConsultation = async (e) => {
    e.preventDefault();

    await api.post("/video-consultations", form);

    setForm({
      appointment_id: "",
      meeting_link: "",
    });

    loadConsultations();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/video-consultations/${id}/status`, { status });
    loadConsultations();
  };

  return (
    <DashboardLayout title="Video Consultations">
      <div className="space-y-6">
        {(user.role === "ADMIN" || user.role === "RECEPTIONIST") && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <h3 className="text-xl font-bold mb-4">
              Create Video Consultation
            </h3>

            <form
              onSubmit={createConsultation}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <select
                name="appointment_id"
                value={form.appointment_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select appointment</option>

                {appointments.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.pet_name} - {app.client_name} -{" "}
                    {new Date(app.appointment_date).toLocaleString()}
                  </option>
                ))}
              </select>

              <input
                name="meeting_link"
                value={form.meeting_link}
                onChange={handleChange}
                placeholder="Google Meet / Zoom link"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
                Create
              </button>
            </form>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold">Consultations List</h3>
              <p className="text-sm text-gray-500">
                {filteredConsultations.length} result(s)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search client, pet, doctor..."
                className="border rounded-lg px-3 py-2"
              />

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
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
            {filteredConsultations.map((item) => (
              <ConsultationCard
                key={item.id}
                item={item}
                user={user}
                updateStatus={updateStatus}
              />
            ))}

            {filteredConsultations.length === 0 && (
              <div className="text-gray-500">
                No video consultations found.
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[950px] w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Pet</th>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Doctor</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Meeting Link</th>
                  <th className="p-3 text-left">Status</th>

                  {(user.role === "ADMIN" ||
                    user.role === "RECEPTIONIST") && (
                    <th className="p-3 text-left">Action</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredConsultations.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.pet_name}</td>
                    <td className="p-3">{item.client_name}</td>
                    <td className="p-3">{item.doctor_name}</td>

                    <td className="p-3 whitespace-nowrap">
                      {new Date(item.appointment_date).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <a
                        href={item.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        Open Link
                      </a>
                    </td>

                    <td className="p-3">
                      <StatusBadge status={item.status} />
                    </td>

                    {(user.role === "ADMIN" ||
                      user.role === "RECEPTIONIST") && (
                      <td className="p-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateStatus(item.id, e.target.value)
                          }
                          className="border rounded-lg px-2 py-1"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredConsultations.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-3 text-gray-500">
                      No video consultations found.
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

function StatusBadge({ status }) {
  const styles = {
    Scheduled: "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

function ConsultationCard({ item, user, updateStatus }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div>
          <h4 className="font-bold text-lg">{item.pet_name}</h4>
          <p className="text-sm text-gray-600">{item.client_name}</p>
        </div>

        <StatusBadge status={item.status} />
      </div>

      <div className="space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Doctor:</span> {item.doctor_name}
        </p>

        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(item.appointment_date).toLocaleString()}
        </p>

        <p>
          <span className="font-semibold">Reason:</span> {item.reason || "-"}
        </p>

        <a
          href={item.meeting_link}
          target="_blank"
          rel="noreferrer"
          className="block text-blue-700 underline mt-2"
        >
          Open Meeting Link
        </a>
      </div>

      {(user.role === "ADMIN" || user.role === "RECEPTIONIST") && (
        <select
          value={item.status}
          onChange={(e) => updateStatus(item.id, e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mt-4"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      )}
    </div>
  );
}

export default VideoConsultationsPage;