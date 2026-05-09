import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function BillsPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    payment: "",
  });

  const [form, setForm] = useState({
    appointment_id: "",
    amount: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const loadBills = async () => {
    const res = await api.get("/bills");
    setBills(res.data);
  };

  const loadAppointments = async () => {
    const res = await api.get("/appointments");
    setAppointments(res.data);
  };

  useEffect(() => {
    loadBills();

    if (user.role === "ADMIN" || user.role === "RECEPTIONIST") {
      loadAppointments();
    }
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const search = filters.search.toLowerCase();

      const matchesSearch =
        bill.client_name?.toLowerCase().includes(search) ||
        bill.pet_name?.toLowerCase().includes(search) ||
        bill.doctor_name?.toLowerCase().includes(search);

      const matchesStatus = filters.status
        ? bill.status === filters.status
        : true;

      const matchesPayment = filters.payment
        ? bill.payment_method === filters.payment
        : true;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bills, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      payment: "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({
      ...paymentForm,
      [e.target.name]: e.target.value,
    });
  };

  const createBill = async (e) => {
    e.preventDefault();

    await api.post("/bills", form);

    setForm({
      appointment_id: "",
      amount: "",
    });

    loadBills();
  };

  const payCash = async (billId) => {
    await api.post(`/bills/${billId}/pay-cash`);
    loadBills();
  };

  const confirmPayment = async (e) => {
    e.preventDefault();

    await api.post(`/bills/${selectedBill.id}/pay-online`);

    setSelectedBill(null);

    setPaymentForm({
      cardholder: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });

    loadBills();
  };

  const downloadInvoice = async (billId) => {
    const res = await api.get(`/bills/${billId}/invoice`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `invoice-${billId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Bills">
      <div className="space-y-6">
        {(user.role === "ADMIN" || user.role === "RECEPTIONIST") && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
            <h3 className="text-xl font-bold mb-4">Create Bill</h3>

            <form
              onSubmit={createBill}
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
                    {app.pet_name} - {app.client_name}
                  </option>
                ))}
              </select>

              <input
                name="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="Amount"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <button className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold">
                Create Bill
              </button>
            </form>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold">Bills List</h3>
              <p className="text-sm text-gray-500">
                {filteredBills.length} result(s)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full xl:w-auto">
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search client, pet..."
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
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              <select
                value={filters.payment}
                onChange={(e) =>
                  setFilters({ ...filters, payment: e.target.value })
                }
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
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
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                user={user}
                payCash={payCash}
                setSelectedBill={setSelectedBill}
                downloadInvoice={downloadInvoice}
              />
            ))}

            {filteredBills.length === 0 && (
              <div className="text-gray-500">No bills found.</div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-[1050px] w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Pet</th>
                  <th className="p-3 text-left">Doctor</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Transaction</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-t">
                    <td className="p-3">{bill.client_name}</td>
                    <td className="p-3">{bill.pet_name}</td>
                    <td className="p-3">{bill.doctor_name}</td>
                    <td className="p-3">${bill.amount}</td>

                    <td className="p-3">
                      <StatusBadge status={bill.status} />
                    </td>

                    <td className="p-3">{bill.payment_method || "-"}</td>

                    <td className="p-3">{bill.transaction_id || "-"}</td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {(user.role === "ADMIN" ||
                          user.role === "RECEPTIONIST") &&
                          bill.status === "Unpaid" && (
                            <button
                              onClick={() => payCash(bill.id)}
                              className="bg-orange-600 text-white px-3 py-1 rounded-lg"
                            >
                              Cash Pay
                            </button>
                          )}

                        {user.role === "CLIENT" &&
                          bill.status === "Unpaid" && (
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg"
                            >
                              Pay Online
                            </button>
                          )}

                        {bill.status === "Paid" && (
                          <span className="text-green-700 font-semibold">
                            Paid
                          </span>
                        )}

                        <button
                          onClick={() => downloadInvoice(bill.id)}
                          className="bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-3 text-gray-500">
                      No bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-blue-700 mb-2">
              Online Payment
            </h3>

            <p className="text-gray-600 mb-4">
              Bill Amount:
              <span className="font-bold text-green-700 ml-2">
                ${selectedBill.amount}
              </span>
            </p>

            <form onSubmit={confirmPayment} className="space-y-4">
              <input
                name="cardholder"
                value={paymentForm.cardholder}
                onChange={handlePaymentChange}
                placeholder="Cardholder Name"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <input
                name="cardNumber"
                value={paymentForm.cardNumber}
                onChange={handlePaymentChange}
                placeholder="Card Number"
                maxLength="16"
                className="w-full border rounded-lg px-3 py-2"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="expiry"
                  value={paymentForm.expiry}
                  onChange={handlePaymentChange}
                  placeholder="MM/YY"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />

                <input
                  name="cvv"
                  value={paymentForm.cvv}
                  onChange={handlePaymentChange}
                  placeholder="CVV"
                  maxLength="3"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="w-full sm:w-1/2 border border-gray-400 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-1/2 bg-green-600 text-white py-2 rounded-lg font-semibold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Paid: "bg-green-100 text-green-700",
    Unpaid: "bg-red-100 text-red-700",
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

function BillCard({ bill, user, payCash, setSelectedBill, downloadInvoice }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg">{bill.pet_name}</h4>
        <StatusBadge status={bill.status} />
      </div>

      <div className="space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Client:</span> {bill.client_name}
        </p>

        <p>
          <span className="font-semibold">Doctor:</span> {bill.doctor_name}
        </p>

        <p>
          <span className="font-semibold">Amount:</span> ${bill.amount}
        </p>

        <p>
          <span className="font-semibold">Payment:</span>{" "}
          {bill.payment_method || "-"}
        </p>

        <p>
          <span className="font-semibold">Transaction:</span>{" "}
          {bill.transaction_id || "-"}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {(user.role === "ADMIN" || user.role === "RECEPTIONIST") &&
          bill.status === "Unpaid" && (
            <button
              onClick={() => payCash(bill.id)}
              className="w-full bg-orange-600 text-white py-2 rounded-lg"
            >
              Cash Pay
            </button>
          )}

        {user.role === "CLIENT" && bill.status === "Unpaid" && (
          <button
            onClick={() => setSelectedBill(bill)}
            className="w-full bg-green-600 text-white py-2 rounded-lg"
          >
            Pay Online
          </button>
        )}

        {bill.status === "Paid" && (
          <div className="text-green-700 font-semibold">Paid</div>
        )}

        <button
          onClick={() => downloadInvoice(bill.id)}
          className="w-full bg-blue-700 text-white py-2 rounded-lg"
        >
          Download Invoice
        </button>
      </div>
    </div>
  );
}

export default BillsPage;