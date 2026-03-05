import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* LOGIN */
import Login from "./pages/Login";

/* ADMIN */
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminHome from "./pages/Admin/AdminHome";
import AdminProfile from "./pages/Admin/AdminProfile";
import AdminExamManagement from "./pages/Admin/AdminExamManagement";
import AdminUserManagement from "./pages/Admin/AdminUserManagement";
import AdminBlockchain from "./pages/Admin/AdminBlockchain";
import AdminApprovals from "./pages/Admin/AdminApprovals";
import AdminReports from "./pages/Admin/AdminReports";
import AdminPublishResults from "./pages/Admin/AdminPublishResults";


/* STAFF */
import StaffLayout from "./pages/Staff/StaffLayout";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import StaffQuestions from "./pages/Staff/StaffQuestions";
import StaffLockPaper from "./pages/Staff/StaffLockPaper";
import StaffResults from "./pages/Staff/StaffResults";
import StaffProfile from "./pages/Staff/StaffProfile";
import StaffMyExams from "./pages/Staff/StaffMyExams";

/* STUDENT */
import StudentLayout from "./pages/Student/StudentLayout";
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentMyExams from "./pages/Student/StudentMyExams";
import AttemptExam from "./pages/Student/AttemptExam";
import StudentResults from "./pages/Student/StudentResults";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentPerformance from "./pages/Student/StudentPerformance";


/* ============================= */
/* 🔐 PROTECTED ROUTE COMPONENT */
/* ============================= */

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/" />;
  if (role && userRole !== role) return <Navigate to="/" />;

  return children;
};


/* ============================= */
/* 🚀 MAIN APP ROUTER */
/* ============================= */

function App() {
  return (
    <Router>

      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />


        {/* ================= ADMIN ROUTES ================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="exams" element={<AdminExamManagement />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="staff" element={<AdminUserManagement defaultTab="staff" />} />
          <Route path="students" element={<AdminUserManagement defaultTab="students" />} />
          <Route path="blockchain" element={<AdminBlockchain />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="publish-results" element={<AdminPublishResults />} />
        </Route>


        {/* ================= STAFF ROUTES ================= */}

        <Route
          path="/staff"
          element={
            <ProtectedRoute role="STAFF">
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="exams" element={<StaffMyExams />} />
          <Route path="questions" element={<StaffQuestions />} />
          <Route path="lock" element={<StaffLockPaper />} />
          <Route path="results" element={<StaffResults />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>


        {/* ================= STUDENT ROUTES ================= */}

        <Route
          path="/student"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="exams" element={<StudentMyExams />} />
          <Route path="attempt/:examId" element={<AttemptExam />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="performance" element={<StudentPerformance />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

      </Routes>

    </Router>
  );
}

export default App;