import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function DashboardLayout({ title, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.log("Notifications failed", err);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    loadNotifications();
  };

  const markAllAsRead = async () => {
    await api.put("/notifications/read-all");
    loadNotifications();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menus = {
    ADMIN: [
      { name: "Dashboard", path: "/admin" },
      { name: "Users", path: "/admin/users" },
      {
        name: "Temporary Registrations",
        path: "/admin/temporary-registrations",
      },
      { name: "Clients & Pets", path: "/admin/clients-pets" },
      { name: "Appointments", path: "/admin/appointments" },
      { name: "Appointments Calendar", path: "/admin/appointments-calendar" },
      { name: "Medical Records", path: "/admin/medical-records" },
      { name: "Video Consultations", path: "/admin/video-consultations" },
      { name: "Bills", path: "/admin/bills" },
      { name: "Profile", path: "/profile" },
    ],
    RECEPTIONIST: [
      { name: "Dashboard", path: "/receptionist" },
      {
        name: "Temporary Registrations",
        path: "/receptionist/temporary-registrations",
      },
      { name: "Clients & Pets", path: "/receptionist/clients-pets" },
      { name: "Appointments", path: "/receptionist/appointments" },
      {
        name: "Appointments Calendar",
        path: "/receptionist/appointments-calendar",
      },
      { name: "Bills", path: "/receptionist/bills" },
      { name: "Video Consultations", path: "/receptionist/video-consultations" },
      { name: "Profile", path: "/profile" },
    ],
    DOCTOR: [
      { name: "Dashboard", path: "/doctor" },
      { name: "My Appointments", path: "/doctor/appointments" },
      { name: "Appointments Calendar", path: "/doctor/appointments-calendar" },
      { name: "Medical Records", path: "/doctor/medical-records" },
      { name: "Video Consultations", path: "/doctor/video-consultations" },
      { name: "Profile", path: "/profile" },
    ],
    CLIENT: [
      { name: "Dashboard", path: "/client" },
      { name: "My Pets", path: "/client/pets" },
      { name: "Book Appointment", path: "/client/book-appointment" },
      { name: "My Bills", path: "/client/bills" },
      { name: "Medical Records", path: "/client/medical-records" },
      { name: "Video Consultations", path: "/client/video-consultations" },
      { name: "Profile", path: "/profile" },
    ],
  };

  const currentMenu = menus[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-blue-800 dark:bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="p-6 border-b border-blue-700 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">PetCare</h1>
            <p className="text-sm text-blue-200 dark:text-gray-400 mt-1">
              {user?.role}
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white text-2xl"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {currentMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="block px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-gray-800"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700 dark:border-gray-700">
          <button
            onClick={logout}
            className="w-full bg-white text-blue-800 dark:bg-gray-800 dark:text-white py-2 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen">
        <header className="bg-white dark:bg-gray-900 shadow-sm px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-2xl text-blue-800 dark:text-white"
            >
              ☰
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative text-2xl"
              >
                🔔

                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-lg z-50">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>

                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-700 dark:text-blue-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="p-4 text-gray-500 dark:text-gray-400">
                        No notifications.
                      </p>
                    )}

                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${notification.is_read
                          ? "bg-white dark:bg-gray-900"
                          : "bg-blue-50 dark:bg-gray-800"
                          }`}
                      >
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;