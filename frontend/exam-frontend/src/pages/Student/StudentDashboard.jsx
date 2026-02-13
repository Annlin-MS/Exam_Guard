import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get("/api/exams/list/");
      setExams(response.data);
    } catch (error) {
      console.error("Error fetching exams", error);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      await api.post("/api/start-exam/", {
        exam_id: examId,
      });

      navigate(`/student/exam/${examId}`);
    } catch (error) {
      alert(error.response?.data?.error || "Cannot start exam");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>🎓 Student Dashboard</h2>

      {exams.length === 0 ? (
        <p>No exams available</p>
      ) : (
        exams.map((exam) => (
          <div
            key={exam.id}
            style={{
              border: "1px solid #ccc",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>{exam.exam_name}</h3>
            <p>Status: {exam.status}</p>

            {exam.status === "ONGOING" && (
              <button onClick={() => handleStartExam(exam.id)}>
                Start Exam
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default StudentDashboard;
