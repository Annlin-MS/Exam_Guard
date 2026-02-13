import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const AttemptExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/api/question-paper/${examId}/`);
      setQuestions(res.data.questions);
    } catch (err) {
      alert("Unable to load question paper");
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (qid, option) => {
    setAnswers({
      ...answers,
      [qid]: option,
    });
  };

  const submitExam = async () => {
    const payload = Object.keys(answers).map((qid) => ({
      question_id: parseInt(qid),
      selected_option: answers[qid],
    }));

    try {
      await api.post("/api/submit-exam/", {
        exam_id: examId,
        answers: payload,
      });
      alert("Exam submitted successfully");
      navigate("/student");
    } catch (err) {
      alert("Submission failed");
    }
  };

  if (loading) return <p>Loading exam...</p>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>📝 Exam</h2>

      {questions.map((q, index) => (
        <div key={q.id} style={{ marginBottom: "20px" }}>
          <p>
            <b>Q{index + 1}.</b> {q.question_text}
          </p>

          {["A", "B", "C", "D"].map((opt) => (
            <label key={opt} style={{ display: "block" }}>
              <input
                type="radio"
                name={`q_${q.id}`}
                checked={answers[q.id] === opt}
                onChange={() => selectOption(q.id, opt)}
              />
              {q[`option_${opt.toLowerCase()}`]}
            </label>
          ))}
        </div>
      ))}

      <button onClick={submitExam}>Submit Exam</button>
    </div>
  );
};

export default AttemptExam;
