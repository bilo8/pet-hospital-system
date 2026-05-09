import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function AppointmentsPage({ mode = "both" }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date: "",
  });

  const [form, setForm] = useState({
    pet_id: "",
    doctor_id: "",
    appointment_date: "",
    reason: "",
  });

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadAppointments = async () => {
    const res = await api.get("/appointments");
    setAppointments(res.data);
  };

  const loadDropdowns = async () => {
    const petsRes = await api.get("/dropdowns/pets");
    const doctorsRes = await api.get("/dropdowns/doctors");

    setPets(petsRes.data);
    setDoctors(doctorsRes.data);
  };

  const loadAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }

    const res = await api.get(
      `/appointments/available-slots?doctor_id=${doctorId}&date=${date}`
    );

    setAvailableSlots(res.data);
  };

  useEffect(() => {
    loadAppointments();
    loadDropdowns();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const searchValue = filters.search.toLowerCase();

      const matchesSearch =
        item.pet_name?.toLowerCase().includes(searchValue) ||
        item.client_name?.toLowerCase().includes(searchValue) ||
        item.doctor_name?.toLowerCase().includes(searchValue) ||
        item.reason?.toLowerCase().includes(searchValue);

      const matchesStatus = filters.status
        ? item.status === filters.status
        : true;

      const itemDate = item.appointment_date
        ? new Date(item.appointment_date).toISOString().slice(0, 10)
        : "";

      const matchesDate = filters.date ? itemDate === filters.date : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    if (name === "doctor_id") {
      loadAvailableSlots(value, selectedDate);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;

    setSelectedDate(date);
    setSelectedSlot("");

    setForm({
      ...form,
      appointment_date: "",
    });

    loadAvailableSlots(form.doctor_id, date);
  };

  const handleSlotChange = (e) => {
    const slot = e.target.value;

    setSelectedSlot(slot);

    setForm({
      ...form,
      appointment_date: `${selectedDate} ${slot}`,
    });
  };

  const createAppointment = async (e) => {
    e.preventDefault();

    try {
      await api.post("/appointments", form);

      setForm({
        pet_id: "",
        doctor_id: "",
        appointment_date: "",
        reason: "",
      });

      setSelectedDate("");
      setSelectedSlot("");
      setAvailableSlots([]);

      loadAppointments();
      alert("Appointment created successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Appointment creation failed");
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/appointments/${id}/status`, { status });
    loadAppointments();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      date: "",
    });
  };

  const showCreateForm =
    user.role === "ADMIN" ||
    user.role === "RECEPTIONIST" ||
    (user.role === "CLIENT" && mode !== "list");

  const showList = !(user.role === "CLIENT" && mode === "create");

  return (
    <DashboardLayout title="Appointments">
      <div className="space-y-6">
        {showCreateForm && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <h3 className="text-xl font-bold mb-4">Create Appointment</h3>

            <form
              onSubmit={createAppointment}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
            >
              <select
                name="pet_id"
                value={form.pet_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select pet</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} - {pet.type}{" "}
                    {pet.breed ? `(${pet.breed})` : ""} / Owner:{" "}
                    {pet.owner_name}
                  </option>
                ))}
              </select>

              <select
                name="doctor_id"
                value={form.doctor_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} - {doctor.specialization}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <select
                value={selectedSlot}
                onChange={handleSlotChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select available time</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot.substring(0, 5)}
                  </option>
                ))}
              </select>

              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Reason"
                className="w-full border rounded-lg px-3 py-2 md:col-span-2 xl:col-span-3"
              />

              <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
                Create
              </button>
            </form>
          </div>
        )}

        {showList && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold">Appointments List</h3>
                <p className="text-sm text-gray-500">
                  {filteredAppointments.length} result(s)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full xl:w-auto">
                <input
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Search pet, client, doctor..."
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <button
                  onClick={clearFilters}
                  className="border border-gray-400 rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[950px] w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Pet</th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Doctor</th>
                    <th className="p-3 text-left">Reason</th>
                    <th className="p-3 text-left">Status</th>

                    {(user.role === "ADMIN" ||
                      user.role === "RECEPTIONIST") && (
                      <th className="p-3 text-left">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(item.appointment_date).toLocaleString()}
                      </td>
                      <td className="p-3">{item.pet_name}</td>
                      <td className="p-3">{item.client_name}</td>
                      <td className="p-3">{item.doctor_name}</td>
                      <td className="p-3">{item.reason || "-"}</td>
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
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan="7">
                        No appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-700",
    Confirmed: "bg-blue-100 text-blue-700",
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

export default AppointmentsPage;