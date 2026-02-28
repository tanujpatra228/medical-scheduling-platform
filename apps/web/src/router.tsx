import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Auth pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";

// Patient pages
import { PatientDashboardPage } from "@/pages/patient/DashboardPage";
import { BookAppointmentPage } from "@/pages/patient/BookAppointmentPage";
import { PatientAppointmentDetailPage } from "@/pages/patient/AppointmentDetailPage";

// Doctor pages
import { DoctorDashboardPage } from "@/pages/doctor/DashboardPage";
import { DoctorSchedulePage } from "@/pages/doctor/SchedulePage";
import { DoctorAppointmentDetailPage } from "@/pages/doctor/AppointmentDetailPage";

// Admin pages
import { AdminDashboardPage } from "@/pages/admin/DashboardPage";
import { AdminDoctorsPage } from "@/pages/admin/DoctorsPage";
import { CreateDoctorPage } from "@/pages/admin/CreateDoctorPage";
import { DoctorDetailPage } from "@/pages/admin/DoctorDetailPage";
import { DoctorEditPage } from "@/pages/admin/DoctorEditPage";

export const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Patient routes
  {
    element: <ProtectedRoute allowedRoles={["PATIENT"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/patient", element: <PatientDashboardPage /> },
          { path: "/patient/book", element: <BookAppointmentPage /> },
          {
            path: "/patient/appointments/:id",
            element: <PatientAppointmentDetailPage />,
          },
        ],
      },
    ],
  },

  // Doctor routes
  {
    element: <ProtectedRoute allowedRoles={["DOCTOR"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/doctor", element: <DoctorDashboardPage /> },
          { path: "/doctor/schedule", element: <DoctorSchedulePage /> },
          {
            path: "/doctor/appointments/:id",
            element: <DoctorAppointmentDetailPage />,
          },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={["CLINIC_ADMIN"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/admin", element: <AdminDashboardPage /> },
          { path: "/admin/doctors", element: <AdminDoctorsPage /> },
          { path: "/admin/doctors/new", element: <CreateDoctorPage /> },
          { path: "/admin/doctors/:id", element: <DoctorDetailPage /> },
          { path: "/admin/doctors/:id/edit", element: <DoctorEditPage /> },
        ],
      },
    ],
  },

  // Root redirect
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
