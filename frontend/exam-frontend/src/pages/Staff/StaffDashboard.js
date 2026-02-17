import React, { useEffect, useState } from "react";
import api from "../../services/api";

const StaffDashboard = () => {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get("/api/exams/");
      setExams(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLock = async (examId) => {
    try {
      await api.post(`/api/exams/${examId}/lock/`);
      alert("Question paper locked successfully!");
      fetchExams();
    } catch (error) {
      alert("Lock failed!");
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Staff Dashboard</h2>

      {exams.map((exam) => (
        <div key={exam.id} style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}>
          <h3>{exam.exam_name}</h3>
          <p>Date: {exam.exam_date}</p>

          <button onClick={() => handleLock(exam.id)}>
            🔒 Lock Question Paper
          </button>
        </div>
      ))}
    </div>
  );
};

export default StaffDashboard;
