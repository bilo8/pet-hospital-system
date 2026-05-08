import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import UsersPage from "./pages/UsersPage";
import ClientsPetsPage from "./pages/ClientsPetsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import VideoConsultationsPage from "./pages/VideoConsultationsPage";
import BillsPage from "./pages/BillsPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import MyPetsPage from "./pages/MyPetsPage";
import PublicRegisterPage from "./pages/PublicRegisterPage";
import TemporaryRegistrationsPage from "./pages/TemporaryRegistrationsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CalendarAppointmentsPage from "./pages/CalendarAppointmentsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "RECEPTIONIST", "DOCTOR", "CLIENT"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/clients-pets"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ClientsPetsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/medical-records"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/video-consultations"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <VideoConsultationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bills"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <BillsPage />
            </ProtectedRoute>
          }
        />

        {/* RECEPTIONIST Routes */}
        <Route
          path="/receptionist"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/clients-pets"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <ClientsPetsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/appointments"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/bills"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <BillsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/video-consultations"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <VideoConsultationsPage />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/medical-records"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/video-consultations"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <VideoConsultationsPage />
            </ProtectedRoute>
          }
        />

        {/* CLIENT Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/book-appointment"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/medical-records"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/video-consultations"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <VideoConsultationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/bills"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <BillsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/pets"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <MyPetsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={<PublicRegisterPage />} />
        <Route
          path="/admin/temporary-registrations"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <TemporaryRegistrationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/temporary-registrations"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <TemporaryRegistrationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments-calendar"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <CalendarAppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/appointments-calendar"
          element={
            <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
              <CalendarAppointmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/appointments-calendar"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <CalendarAppointmentsPage />
            </ProtectedRoute>
          }
        /><Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
