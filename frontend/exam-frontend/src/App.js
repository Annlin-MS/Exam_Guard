import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/Student/StudentDashboard";
import AttemptExam from "./pages/Student/AttemptExam";
import StaffDashboard from "./pages/Staff/StaffDashboard";

import AdminLayout from "./pages/Admin/AdminLayout";
import AdminHome from "./pages/Admin/AdminHome";
import AdminProfile from "./pages/Admin/AdminProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/exam/:examId" element={<AttemptExam />} />

        <Route path="/staff/dashboard" element={<StaffDashboard />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;