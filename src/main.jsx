import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  AccountantDashboard,
  AccountantProfile,
  AccountSummary,
  AdminDashboard,
  AdminProfile,
  AdminRegistration,
  AdmissionRequest,
  AdmitBulk,
  AdmitIndividual,
  AdmitSlips,
  App,
  AttendanceStaff,
  AttendanceStd,
  BirthdayManagement,
  BulkFee,
  ClassManagement,
  DecrementFee,
  Email,
  FamilyCredits,
  FeeCalculation,
  FeeVouchers,
  GenerateCustomFee,
  GetStartedPage,
  HandleParentRequest,
  IdCards,
  IncomeExpense,
  IncrementFee,
  Loan,
  LoginPage,
  ManageAccountants,
  MarkSheet,
  Noticeboard,
  PageNotFound,
  ParentAccount,
  PrintAdmissionForms,
  PromoteStd,
  ReportingPage,
  Rooms,
  SMS,
  SmsAlerts,
  SmsHistory,
  StaffCards,
  StaffSalary,
  StudentInfo,
  SubjectManagement,
  TimetableManagement,
  TransportFee,
  ViewOnlineClasses,
  ViewTimetable,
  WeeklyTaskManager,
} from "./pages";
import Layout from "./Layout";
import Section from "./Section";
import AuthLayout from "./components/auth/AuthLayout";
import FeeTypes from "./pages/Accountant/FeeTypes";
import FeeStructures from "./pages/Accountant/FeeStructures";
import StudentFees from "./pages/Accountant/StudentFees";
import FeeDiscounts from "./pages/Accountant/FeeDiscounts";
import CreateExam from "./pages/Admin/CreateExam";
import FeePayments from "./pages/Accountant/FeePayments";
import LatePaymentFines from "./pages/Accountant/LatePaymentFines";
import ClassAnnouncements from "./pages/Admin/ClassAnnouncements";
import ClassTasks from "./pages/Admin/ClassTasks";
import TeacherDetails from "./pages/Admin/TeacherDetails";
import StaffDetails from "./pages/Admin/StaffDetails";
import StudentIDCardPage from "./pages/Admin/StudentIDCardPage";
import TeacherIDCardPage from "./pages/Admin/TeacherIDCardPage";
import StaffIDCardPage from "./pages/Admin/StaffIDCardPage";
import GradeCriteriaPage from "./pages/Admin/GradeCriteria";
import GradeCriteria from "./pages/Admin/GradeCriteria";
import StudentResults from "./pages/Admin/StudentResults";
import FinalResults from "./pages/Admin/FinalResults";
import PromotionRecords from "./pages/Admin/PromotionRecords";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <GetStartedPage />,
      },
      {
        path: "/admin",
        element: (
          <AuthLayout path="/admin">
            <Section />
          </AuthLayout>
        ),
        children: [
          {
            path: "/admin",
            element: <AdminDashboard />,
          },
          {
            path: "/admin/admit-individual",
            element: <AdmitIndividual />,
          },
          {
            path: "/admin/admit-bulk",
            element: <AdmitBulk />,
          },
          {
            path: "/admin/print-admission-forms",
            element: <PrintAdmissionForms />,
          },
          {
            path: "/admin/manage-admission-requests",
            element: <AdmissionRequest />,
          },
          {
            path: "/admin/promote-students",
            element: <PromoteStd />,
          },
          {
            path: "/admin/manage-student-information",
            element: <StudentInfo />,
          },
          {
            path: "/admin/generate-student-id-cards",
            element: <StudentIDCardPage />,
          },
          {
            path: "/admin/promotion-records",
            element: <PromotionRecords />,
          },
          {
            path: "/admin/birthday-management",
            element: <BirthdayManagement />,
          },
          {
            path: "/admin/manage-parent-account",
            element: <ParentAccount />,
          },
          {
            path: "/admin/handle-parent-requests",
            element: <HandleParentRequest />,
          },
          {
            path: "/admin/manage-teacher-details",
            element: <TeacherDetails />,
          },
          {
            path: "/admin/manage-staff-details",
            element: <StaffDetails />,
          },
          {
            path: "/admin/generate-teacher-id-cards",
            element: <TeacherIDCardPage />,
          },
          {
            path: "/admin/generate-staff-id-cards",
            element: <StaffIDCardPage />,
          },
          {
            path: "/admin/track-students-attendance",
            element: <AttendanceStd />,
          },
          {
            path: "/admin/track-staff-attendance",
            element: <AttendanceStaff />,
          },
          {
            path: "/admin/alerts-for-absents",
            element: <SmsAlerts />,
          },
          {
            path: "/admin/create-exam",
            element: <CreateExam />,
          },
          {
            path: "/admin/admit-slips",
            element: <AdmitSlips />,
          },
          {
            path: "/admin/mark-sheet",
            element: <MarkSheet />,
          },
          {
            path: "/admin/manage-timetable",
            element: <TimetableManagement />,
          },
          {
            path: "/admin/view-timetable",
            element: <ViewTimetable />,
          },
          {
            path: "/admin/reporting",
            element: <ReportingPage />,
          },
          {
            path: "/admin/noticeboard",
            element: <Noticeboard />,
          },
          {
            path: "/admin/view-online-class",
            element: <ViewOnlineClasses />,
          },
          {
            path: "/admin/weekly-task-manager",
            element: <WeeklyTaskManager />,
          },
          {
            path: "/admin/registration",
            element: <AdminRegistration />,
          },
          {
            path: "/admin/class-management",
            element: <ClassManagement />,
          },
          {
            path: "/admin/accountants-management",
            element: <ManageAccountants />,
          },
          {
            path: "/admin/admin-profile",
            element: <AdminProfile />,
          },
          {
            path: "/admin/rooms-management",
            element: <Rooms />,
          },
          {
            path: "/admin/subject-management",
            element: <SubjectManagement />,
          },
          {
            path: "/admin/fee-type",
            element: <FeeTypes />,
          },
          {
            path: "/admin/fee-structure",
            element: <FeeStructures />,
          },
          {
            path: "/admin/fee-payment",
            element: <FeePayments />,
          },
          {
            path: "/admin/student-fee",
            element: <StudentFees />,
          },
          {
            path: "/admin/staff-salary",
            element: <StaffSalary />,
          },
          {
            path: "/admin/class-announcements",
            element: <ClassAnnouncements/>,
          },
          {
            path: "/admin/class-tasks",
            element: <ClassTasks/>,
          },
          {
            path: "/admin/grade-criteria",
            element: <GradeCriteria/>,
          },
          {
            path: "/admin/student-results",
            element: <StudentResults/>,
          },
          {
            path: "/admin/final-results",
            element: <FinalResults/>,
          },

        ],
      },
      {
        path: "/accountant",
        element: (
          <AuthLayout path="/accountant">
            <Layout />
          </AuthLayout>
        ),
        children: [
          {
            path: "/accountant",
            element: <AccountantDashboard />,
          },
          {
            path: "/accountant/fee-type",
            element: <FeeTypes />,
          },
          {
            path: "/accountant/fee-structure",
            element: <FeeStructures />,
          },
          {
            path: "/accountant/student-fee",
            element: <StudentFees />,
          },
          {
            path: "/accountant/custom-fee",
            element: <GenerateCustomFee />,
          },
          {
            path: "/accountant/transport-fee",
            element: <TransportFee />,
          },
          {
            path: "/accountant/bulk-fee",
            element: <BulkFee />,
          },
          {
            path: "/accountant/family-credits",
            element: <FamilyCredits />,
          },
          {
            path: "/accountant/fee-calculation",
            element: <FeeCalculation />,
          },
          {
            path: "/accountant/increment-fee",
            element: <IncrementFee />,
          },
          {
            path: "/accountant/fee-discount",
            element: <FeeDiscounts />,
          },
          {
            path: "/accountant/late-payment-fine",
            element: <LatePaymentFines />
          },
          {
            path: "/accountant/fee-payment",
            element: <FeePayments />,
          },
          {
            path: "/accountant/fee-vouchers",
            element: <FeeVouchers />,
          },
          {
            path: "/accountant/staff-salary",
            element: <StaffSalary />,
          },
          {
            path: "/accountant/loan-applicaton",
            element: <Loan />,
          },
          {
            path: "/accountant/income-expense",
            element: <IncomeExpense />,
          },
          {
            path: "/accountant/account-summary",
            element: <AccountSummary />,
          },
          {
            path: "/accountant/updates-via-SMS",
            element: <SMS />,
          },
          {
            path: "/accountant/updates-via-email",
            element: <Email />,
          },
          {
            path: "/accountant/sms-history",
            element: <SmsHistory />,
          },
          {
            path: "/accountant/accountant-profile",
            element: <AccountantProfile />,
          },
        ],
      },
      {
        path: "/login",
        element: (
          <AuthLayout path="/login">
            <LoginPage />
          </AuthLayout>
        ),
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
