import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";

function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    pets: 0,
    appointments: 0,
    unpaidBills: 0,
  });

  const [charts, setCharts] = useState({
    appointmentStatus: [],
    billStatus: [],
    petTypes: [],
    doctorWorkload: [],
  });

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadStats = async () => {
    const statsRes = await api.get("/stats/admin");
    const chartsRes = await api.get("/stats/admin/charts");

    setStats(statsRes.data);
    setCharts(chartsRes.data);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6">
          <Card title="Users" value={stats.users} />
          <Card title="Clients" value={stats.clients} />
          <Card title="Pets" value={stats.pets} />
          <Card title="Appointments" value={stats.appointments} />
          <Card title="Unpaid Bills" value={stats.unpaidBills} />
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          <ChartCard title="Appointments by Status">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.appointmentStatus}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Bills Paid vs Unpaid">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.billStatus}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={100}
                  label
                >
                  {charts.billStatus.map((entry, index) => (
                    <Cell
                      key={`bill-${index}`}
                      fill={index % 2 === 0 ? "#dc2626" :"#16a34a" }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Pet Types Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.petTypes}
                  dataKey="count"
                  nameKey="type"
                  outerRadius={100}
                  label
                >
                  {charts.petTypes.map((entry, index) => (
                    <Cell
                      key={`pet-${index}`}
                      fill={
                        ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#dc2626"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Doctor Workload">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.doctorWorkload}>
                <XAxis dataKey="doctor_name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
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

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default AdminDashboard;