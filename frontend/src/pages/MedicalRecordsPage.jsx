import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function MedicalRecordsPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [records, setRecords] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    pet_id: "",
    date: "",
  });

  const [form, setForm] = useState({
    pet_id: "",
    doctor_id: "",
    appointment_id: "",
    diagnosis: "",
    treatment: "",
    medication: "",
    dosage: "",
    visit_summary: "",
    next_visit_date: "",
    notes: "",
  });

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadRecords = async () => {
    const res = await api.get("/medical-records");
    setRecords(res.data);
  };

  const loadData = async () => {
    const petsRes = await api.get("/dropdowns/pets");
    const appointmentsRes = await api.get("/appointments");
    const doctorsRes = await api.get("/dropdowns/doctors");

    setPets(petsRes.data);
    setAppointments(appointmentsRes.data);
    setDoctors(doctorsRes.data);
  };

  useEffect(() => {
    loadData();
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const search = filters.search.toLowerCase();

      const matchesSearch =
        record.pet_name?.toLowerCase().includes(search) ||
        record.doctor_name?.toLowerCase().includes(search) ||
        record.diagnosis?.toLowerCase().includes(search) ||
        record.treatment?.toLowerCase().includes(search) ||
        record.medication?.toLowerCase().includes(search) ||
        record.visit_summary?.toLowerCase().includes(search) ||
        record.notes?.toLowerCase().includes(search);

      const matchesPet = filters.pet_id
        ? String(record.pet_id) === String(filters.pet_id) ||
          record.pet_name === pets.find((p) => String(p.id) === String(filters.pet_id))?.name
        : true;

      const recordDate = record.record_date
        ? new Date(record.record_date).toISOString().slice(0, 10)
        : "";

      const matchesDate = filters.date ? recordDate === filters.date : true;

      return matchesSearch && matchesPet && matchesDate;
    });
  }, [records, filters, pets]);

  const clearFilters = () => {
    setFilters({
      search: "",
      pet_id: "",
      date: "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addRecord = async (e) => {
    e.preventDefault();

    await api.post("/medical-records", form);

    setForm({
      pet_id: "",
      doctor_id: "",
      appointment_id: "",
      diagnosis: "",
      treatment: "",
      medication: "",
      dosage: "",
      visit_summary: "",
      next_visit_date: "",
      notes: "",
    });

    loadRecords();
  };

  return (
    <DashboardLayout title="Medical Records">
      <div className="grid xl:grid-cols-3 gap-6">
        {(user.role === "DOCTOR" || user.role === "ADMIN") && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <h3 className="text-xl font-bold mb-4">Add Medical Record</h3>

            <form onSubmit={addRecord} className="space-y-3">
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
                    {pet.name} - {pet.type} / Owner: {pet.owner_name}
                  </option>
                ))}
              </select>

              {user.role === "ADMIN" && (
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
              )}

              <select
                name="appointment_id"
                value={form.appointment_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select appointment</option>
                {appointments.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.pet_name} -{" "}
                    {new Date(app.appointment_date).toLocaleString()}
                  </option>
                ))}
              </select>

              <textarea
                name="diagnosis"
                value={form.diagnosis}
                onChange={handleChange}
                placeholder="Diagnosis"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <textarea
                name="treatment"
                value={form.treatment}
                onChange={handleChange}
                placeholder="Treatment"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <input
                name="medication"
                value={form.medication}
                onChange={handleChange}
                placeholder="Medication"
                className="w-full border rounded-lg px-3 py-2"
              />

              <input
                name="dosage"
                value={form.dosage}
                onChange={handleChange}
                placeholder="Dosage"
                className="w-full border rounded-lg px-3 py-2"
              />

              <textarea
                name="visit_summary"
                value={form.visit_summary}
                onChange={handleChange}
                placeholder="Visit summary"
                className="w-full border rounded-lg px-3 py-2"
              />

              <input
                name="next_visit_date"
                type="date"
                value={form.next_visit_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Notes"
                className="w-full border rounded-lg px-3 py-2"
              />

              <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
                Save Record
              </button>
            </form>
          </div>
        )}

        <div
          className={
            user.role === "DOCTOR" || user.role === "ADMIN"
              ? "xl:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow"
              : "xl:col-span-3 bg-white p-4 md:p-6 rounded-2xl shadow"
          }
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold">Pet Medical History</h3>
              <p className="text-sm text-gray-500">
                {filteredRecords.length} result(s) — diagnosis, treatment,
                medication, and visit history.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full xl:w-auto">
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search history..."
                className="border rounded-lg px-3 py-2 w-full"
              />

              <select
                value={filters.pet_id}
                onChange={(e) =>
                  setFilters({ ...filters, pet_id: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full"
              >
                <option value="">All pets</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} - {pet.type}
                  </option>
                ))}
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

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <MedicalRecordTimelineCard key={record.id} record={record} />
            ))}

            {filteredRecords.length === 0 && (
              <div className="text-gray-500">No medical records found.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MedicalRecordTimelineCard({ record }) {
  return (
    <div className="relative border-l-4 border-blue-600 pl-5 bg-gray-50 rounded-2xl p-5">
      <div className="absolute -left-3 top-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white" />

      <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xl font-bold text-gray-800">
            {record.pet_name}
          </h4>
          <p className="text-sm text-gray-500">Doctor: {record.doctor_name}</p>
        </div>

        <div className="text-sm text-gray-500">
          {new Date(record.record_date).toLocaleString()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoBox title="Diagnosis" value={record.diagnosis} />
        <InfoBox title="Treatment" value={record.treatment} />
        <InfoBox title="Medication" value={record.medication || "-"} />
        <InfoBox title="Dosage" value={record.dosage || "-"} />

        <div className="md:col-span-2">
          <InfoBox title="Visit Summary" value={record.visit_summary || "-"} />
        </div>

        <div className="md:col-span-2">
          <InfoBox title="Notes" value={record.notes || "-"} />
        </div>
      </div>

      {record.next_visit_date && (
        <div className="mt-4 bg-blue-100 text-blue-700 px-4 py-3 rounded-xl font-semibold">
          Next visit:{" "}
          {new Date(record.next_visit_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function InfoBox({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-4 border">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
        {title}
      </p>
      <p className="mt-1 text-gray-800">{value}</p>
    </div>
  );
}

export default MedicalRecordsPage;