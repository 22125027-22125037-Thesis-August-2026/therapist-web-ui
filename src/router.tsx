import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LicensePendingPage } from "@/pages/auth/LicensePendingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AppointmentsListPage } from "@/pages/appointments/AppointmentsListPage";
import { AppointmentDetailPage } from "@/pages/appointments/AppointmentDetailPage";
import { VideoSessionPage } from "@/pages/appointments/VideoSessionPage";
import { AvailabilityPage } from "@/pages/availability/AvailabilityPage";
import { PatientsListPage } from "@/pages/patients/PatientsListPage";
import { PatientProfilePage } from "@/pages/patients/PatientProfilePage";
import { MessagesPage } from "@/pages/messages/MessagesPage";
import { ClinicalNotesListPage } from "@/pages/clinical-notes/ClinicalNotesListPage";
import { ClinicalNoteEditorPage } from "@/pages/clinical-notes/ClinicalNoteEditorPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/license-pending", element: <LicensePendingPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "appointments", element: <AppointmentsListPage /> },
      { path: "appointments/:id", element: <AppointmentDetailPage /> },
      { path: "appointments/:id/video", element: <VideoSessionPage /> },
      { path: "availability", element: <AvailabilityPage /> },
      { path: "patients", element: <PatientsListPage /> },
      { path: "patients/:id", element: <PatientProfilePage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "clinical-notes", element: <ClinicalNotesListPage /> },
      { path: "clinical-notes/new", element: <ClinicalNoteEditorPage /> },
      { path: "clinical-notes/:id", element: <ClinicalNoteEditorPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
