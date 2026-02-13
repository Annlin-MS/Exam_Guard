import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import StudentDashboard from "./pages/Student/StudentDashboard";
import AttemptExam from "./pages/Student/AttemptExam";

// (Add later when ready)
// import StaffDashboard from "./pages/Staff/StaffDashboard";
// import AdminDashboard from "./pages/Admin/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/" element={<Login />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/exam/:examId" element={<AttemptExam />} />

        {/* Future Staff Routes */}
        {/* <Route path="/staff/dashboard" element={<StaffDashboard />} /> */}

        {/* Future Admin Routes */}
        {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
