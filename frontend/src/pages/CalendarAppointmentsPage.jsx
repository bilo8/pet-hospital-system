import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import DashboardLayout from "../components/DashboardLayout";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

function CalendarAppointmentsPage() {
  const token = localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadAppointments = async () => {
    const res = await api.get("/appointments");
    setAppointments(res.data);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const events = useMemo(() => {
    return appointments.map((app) => ({
      id: app.id,
      title: `${app.pet_name} with ${app.doctor_name}`,
      start: new Date(app.appointment_date),
      end: moment(app.appointment_date).add(1, "hour").toDate(),
      resource: app,
    }));
  }, [appointments]);

  return (
    <DashboardLayout title="Appointments Calendar">
      <div className="space-y-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow relative z-0">
          <p className="text-gray-600 mb-4">
            View all appointments by month, week, day, or agenda.
          </p>

          <div className="h-[650px] relative z-0">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={calendarDate}
              view={calendarView}
              onNavigate={(date) => setCalendarDate(date)}
              onView={(view) => setCalendarView(view)}
              views={["month", "week", "day", "agenda"]}
              popup
              onSelectEvent={(event) => setSelectedEvent(event.resource)}
            />
          </div>
        </div>

        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">
                Appointment Details
              </h3>

              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-semibold">Pet:</span>{" "}
                  {selectedEvent.pet_name}
                </p>

                <p>
                  <span className="font-semibold">Client:</span>{" "}
                  {selectedEvent.client_name}
                </p>

                <p>
                  <span className="font-semibold">Doctor:</span>{" "}
                  {selectedEvent.doctor_name}
                </p>

                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(selectedEvent.appointment_date).toLocaleString()}
                </p>

                <p>
                  <span className="font-semibold">Reason:</span>{" "}
                  {selectedEvent.reason || "-"}
                </p>

                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedEvent.status}
                </p>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="mt-6 w-full bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CalendarAppointmentsPage;