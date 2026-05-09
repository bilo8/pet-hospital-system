import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/DashboardLayout";

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export default function DoctorAvailabilityPage() {
    const token = localStorage.getItem("token");

    const api = axios.create({
        baseURL: `${import.meta.env.VITE_API_URL}/api`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const [availabilities, setAvailabilities] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [formData, setFormData] = useState({
        doctor_id: "",
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "17:00",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [availabilityRes, doctorsRes] = await Promise.all([
                api.get("/doctor-availability"),
                api.get("/dropdowns/doctors"),
            ]);

            setAvailabilities(availabilityRes.data);
            setDoctors(doctorsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post("/doctor-availability", formData);

            setFormData({
                doctor_id: "",
                day_of_week: "Monday",
                start_time: "09:00",
                end_time: "17:00",
            });

            loadData();

            toast.success("Availability added successfully");
        } catch (err) {
            console.error(err);
            toast.error("Creation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this availability?")) return;

        try {
            await api.delete(`/doctor-availability/${id}`);
            loadData();
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    return (
        <DashboardLayout title="Doctor Availability">
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Doctor Availability
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <select
                        value={formData.doctor_id}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                doctor_id: e.target.value,
                            })
                        }
                        className="border rounded-lg p-3"
                        required
                    >
                        <option value="">Select Doctor</option>

                        {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                                {doctor.full_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={formData.day_of_week}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                day_of_week: e.target.value,
                            })
                        }
                        className="border rounded-lg p-3"
                    >
                        {days.map((day) => (
                            <option key={day}>{day}</option>
                        ))}
                    </select>

                    <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                start_time: e.target.value,
                            })
                        }
                        className="border rounded-lg p-3"
                        required
                    />

                    <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                end_time: e.target.value,
                            })
                        }
                        className="border rounded-lg p-3"
                        required
                    />

                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 md:col-span-4"
                    >
                        Add Availability
                    </button>
                </form>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 text-left">Doctor</th>
                                <th className="p-4 text-left">Specialization</th>
                                <th className="p-4 text-left">Day</th>
                                <th className="p-4 text-left">Start</th>
                                <th className="p-4 text-left">End</th>
                                <th className="p-4 text-left">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {availabilities.map((availability) => (
                                <tr
                                    key={availability.id}
                                    className="border-t"
                                >
                                    <td className="p-4">
                                        {availability.doctor_name}
                                    </td>

                                    <td className="p-4">
                                        {availability.specialization}
                                    </td>

                                    <td className="p-4">
                                        {availability.day_of_week}
                                    </td>

                                    <td className="p-4">
                                        {availability.start_time}
                                    </td>

                                    <td className="p-4">
                                        {availability.end_time}
                                    </td>

                                    <td className="p-4">
                                        <button
                                            onClick={() =>
                                                handleDelete(availability.id)
                                            }
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {availabilities.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center p-8 text-gray-500"
                                    >
                                        No availability found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}