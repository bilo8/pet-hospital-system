import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function TemporaryRegistrationsPage() {
  const token = localStorage.getItem("token");

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const api = axios.create({
    baseURL: "http://192.168.1.105:5000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadRequests = async () => {
    const res = await api.get(`/temporary-registrations?search=${search}`);
    setRequests(res.data);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const confirmRequest = async (id) => {
    const ok = window.confirm(
      "Confirm this registration? A client account will be created with default password 123456."
    );

    if (!ok) return;

    try {
      const res = await api.post(`/temporary-registrations/${id}/confirm`);
      setMessage(res.data.message);
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Confirmation failed");
    }
  };

  const resendVerification = async (id) => {
    try {
      const res = await api.post(
        `/temporary-registrations/${id}/resend-verification`
      );

      setMessage(res.data.message);
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend email");
    }
  };

  const deleteRequest = async (id) => {
    const ok = window.confirm("Delete this temporary registration?");
    if (!ok) return;

    await api.delete(`/temporary-registrations/${id}`);
    setMessage("Temporary registration deleted");
    loadRequests();
  };

  return (
    <DashboardLayout title="Temporary Registrations">
      <div className="space-y-6">
        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email"
              className="border rounded-lg px-3 py-2 w-full sm:w-96"
            />

            <button
              onClick={loadRequests}
              className="bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Pet</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Preferred Date</th>
                  <th className="p-3 text-left">Email Status</th>
                  <th className="p-3 text-left">Request Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.full_name}</td>
                    <td className="p-3">{item.email}</td>
                    <td className="p-3">{item.phone || "-"}</td>
                    <td className="p-3">{item.pet_name}</td>
                    <td className="p-3">{item.type}</td>

                    <td className="p-3">
                      {item.preferred_date
                        ? new Date(item.preferred_date).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      {item.email_verified ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Not Verified
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {item.status === "Pending" && (
                          <button
                            disabled={!item.email_verified}
                            onClick={() => confirmRequest(item.id)}
                            className={`px-3 py-1 rounded-lg text-white ${
                              item.email_verified
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Confirm
                          </button>
                        )}

                        {!item.email_verified && item.status === "Pending" && (
                          <button
                            onClick={() => resendVerification(item.id)}
                            className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600"
                          >
                            Resend
                          </button>
                        )}

                        <button
                          onClick={() => deleteRequest(item.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {requests.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-3 text-gray-500">
                      No temporary registrations found.
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
    Pending: "bg-yellow-100 text-yellow-700",
    Confirmed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Missed: "bg-gray-100 text-gray-700",
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

export default TemporaryRegistrationsPage;