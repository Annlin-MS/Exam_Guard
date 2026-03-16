import React, { useState, useEffect } from "react";
import api from "../../services/api";

const DEPT_LABELS = {
  CS:    "Computer Science",
  ECE:   "Electronics",
  MECH:  "Mechanical",
  CIVIL: "Civil",
  MBA:   "MBA",
  ALL:   "All Departments",
};

const DEPT_ICONS = {
  CS:    "💻",
  ECE:   "⚡",
  MECH:  "⚙️",
  CIVIL: "🏗️",
  MBA:   "📊",
  ALL:   "🌐",
};

const AdminPublishResults = () => {
  const [activeTab, setActiveTab]             = useState("publish");
  const [allExams, setAllExams]               = useState([]);
  const [allStudents, setAllStudents]         = useState([]);
  const [selectedDept, setSelectedDept]       = useState(null);
  const [selectedSem, setSelectedSem]         = useState(null);
  const [selectedExam, setSelectedExam]       = useState(null);
  const [examData, setExamData]               = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [publishing, setPublishing]           = useState(false);
  const [toast, setToast]                     = useState(null);
  const [unattemptedData, setUnattemptedData] = useState(null);
  const [unaDept, setUnaDept]                 = useState(null);
  const [unaSem, setUnaSem]                   = useState(null);
  const [unaExam, setUnaExam]                 = useState(null);
  const [unaDetail, setUnaDetail]             = useState(null);
  const [unaDetailLoading, setUnaDetailLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [examsRes, studentsRes] = await Promise.all([
        api.get("/api/exams/"),
        api.get("/api/admin/students/"),
      ]);
      setAllExams(examsRes.data.filter(e => e.workflow_status === "LOCKED"));
      setAllStudents(studentsRes.data);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamResults = async (examId) => {
    setDetailLoading(true);
    setExamData(null);
    setUnattemptedData(null);
    try {
      const [resultsRes, unaRes] = await Promise.all([
        api.get(`/api/admin/exams/${examId}/results/`),
        api.get(`/api/admin/exams/${examId}/unattempted/`),
      ]);
      setExamData(resultsRes.data);
      setUnattemptedData(unaRes.data);
    } catch (err) {
      showToast("Failed to load results", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchUnaDetail = async (examId) => {
    setUnaDetailLoading(true);
    setUnaDetail(null);
    try {
      const res = await api.get(`/api/admin/exams/${examId}/unattempted/`);
      setUnaDetail(res.data);
    } catch (e) { console.error(e); }
    finally { setUnaDetailLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Check if exam is still ongoing using selectedExam from allExams ──
  const isExamOngoing = () => {
    if (!selectedExam) return false;
    const examDate      = selectedExam.exam_date;
    const startTime     = selectedExam.start_time;
    const durationMins  = selectedExam.duration_minutes || 0;
    if (!examDate || !startTime) return false;
    const examEnd = new Date(`${examDate}T${startTime}`);
    examEnd.setMinutes(examEnd.getMinutes() + durationMins);
    return new Date() < examEnd;
  };

  const getTimeLeft = () => {
    if (!selectedExam) return 0;
    const examDate      = selectedExam.exam_date;
    const startTime     = selectedExam.start_time;
    const durationMins  = selectedExam.duration_minutes || 0;
    if (!examDate || !startTime) return 0;
    const examEnd = new Date(`${examDate}T${startTime}`);
    examEnd.setMinutes(examEnd.getMinutes() + durationMins);
    return Math.max(0, Math.ceil((examEnd - new Date()) / 60000));
  };

  const departments = [...new Set([
    ...allExams.map(e => e.department),
    ...allStudents.map(s => s.department).filter(Boolean),
  ])].filter(d => d && d !== "—");

  const semestersForDept = (dept) => dept
    ? [...new Set([
        ...allExams
          .filter(e => dept === "ALL" || e.department === dept)
          .map(e => e.semester || "ALL"),
        ...allStudents
          .filter(s => dept === "ALL" || s.department === dept)
          .map(s => s.semester).filter(Boolean),
      ])].sort()
    : [];

  const examsForFilter = (dept, sem) => allExams.filter(e => {
    if (!dept) return false;
    const deptMatch = dept === "ALL" || e.department === dept;
    const semMatch  = !sem || sem === "ALL" || e.semester === sem;
    return deptMatch && semMatch;
  });

  const studentsForFilter = allStudents.filter(s => {
    if (!selectedDept) return false;
    const deptMatch = selectedDept === "ALL" || s.department === selectedDept;
    const semMatch  = !selectedSem || selectedSem === "ALL" || s.semester === selectedSem;
    return deptMatch && semMatch;
  });

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    setSelectedSem(null);
    setSelectedExam(null);
    setExamData(null);
    setUnattemptedData(null);
    setExpandedStudent(null);
  };

  const handleSemSelect = (sem) => {
    setSelectedSem(sem);
    setSelectedExam(null);
    setExamData(null);
    setUnattemptedData(null);
    setExpandedStudent(null);
  };

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    fetchExamResults(exam.id);
  };

  const handlePublishAll = async () => {
    if (!selectedExam) return;
    if (!window.confirm(
      `Publish ALL results for "${selectedExam.exam_name}"?\n\nAll students will be able to see their scores.`
    )) return;
    setPublishing(true);
    try {
      const res = await api.post(`/api/admin/exams/${selectedExam.id}/publish-results/`);
      showToast(res.data.message + " 🎉");
      fetchExamResults(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to publish!", "error");
    } finally {
      setPublishing(false);
    }
  };

  const getGradeColor = (pct) => {
    if (pct >= 80) return "#00C9A7";
    if (pct >= 60) return "#FFD166";
    if (pct >= 40) return "#FF6B6B";
    return "#94a3b8";
  };
  const getGrade = (pct) => {
    if (pct >= 80) return "A";
    if (pct >= 60) return "B";
    if (pct >= 40) return "C";
    return "F";
  };

  const DeptSemSelector = ({ dept, onDept, sem, onSem }) => (
    <>
      <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: "1px solid rgba(26,26,46,0.08)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.1em", marginBottom: 14 }}>
          STEP 1 — SELECT DEPARTMENT
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {departments.map(d => {
            const isSelected   = dept === d;
            const examCount    = allExams.filter(e => e.department === d).length;
            const studentCount = allStudents.filter(s => s.department === d).length;
            return (
              <button key={d} className="sel-btn" onClick={() => onDept(d)}
                style={{ padding: "14px 20px", borderRadius: 14, border: isSelected ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.1)", background: isSelected ? "rgba(108,99,255,0.08)" : "#fff", textAlign: "left", minWidth: 150, cursor: "pointer" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{DEPT_ICONS[d] || "🏛️"}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: isSelected ? "#6C63FF" : "#1a1a2e" }}>
                  {DEPT_LABELS[d] || d}
                </div>
                <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", marginTop: 4, display: "flex", gap: 8 }}>
                  <span>📝 {examCount}</span>
                  <span>👨‍🎓 {studentCount}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {dept && (
        <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: "1px solid rgba(26,26,46,0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.1em", marginBottom: 14 }}>
            STEP 2 — SELECT SEMESTER
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: "#6C63FF" }}>
              {DEPT_LABELS[dept] || dept}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="sel-btn" onClick={() => onSem("ALL")}
              style={{ padding: "10px 20px", borderRadius: 10, border: sem === "ALL" ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.1)", background: sem === "ALL" ? "rgba(108,99,255,0.08)" : "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: sem === "ALL" ? "#6C63FF" : "#1a1a2e", cursor: "pointer" }}>
              All Semesters
            </button>
            {semestersForDept(dept).filter(s => s !== "ALL" && s).map(s => {
              const isSel        = sem === s;
              const examCount    = allExams.filter(e => (dept === "ALL" || e.department === dept) && e.semester === s).length;
              const studentCount = allStudents.filter(st => (dept === "ALL" || st.department === dept) && st.semester === s).length;
              return (
                <button key={s} className="sel-btn" onClick={() => onSem(s)}
                  style={{ padding: "10px 20px", borderRadius: 10, border: isSel ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.1)", background: isSel ? "rgba(108,99,255,0.08)" : "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: isSel ? "#6C63FF" : "#1a1a2e", cursor: "pointer", textAlign: "left" }}>
                  Semester {s}
                  <div style={{ fontSize: 10, color: "rgba(26,26,46,0.4)", marginTop: 2, fontWeight: 400 }}>
                    {examCount} exams · {studentCount} students
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "'DM Sans',sans-serif", color: "rgba(26,26,46,0.5)" }}>
      Loading...
    </div>
  );

  const unpublishedCount = examData ? examData.total_attempted - examData.total_published : 0;
  const ongoing          = isExamOngoing();
  const timeLeft         = getTimeLeft();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up  { animation: fadeUp 0.3s ease both; }
        .sel-btn  { transition: all 0.15s; }
        .sel-btn:hover { transform: translateY(-2px); filter: brightness(1.03); }
        .std-row:hover { background: rgba(108,99,255,0.02) !important; }
        .stu-row  { transition: all 0.15s; cursor: pointer; }
        .stu-row:hover { background: rgba(108,99,255,0.03) !important; }
        .act-btn  { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "14px 24px", borderRadius: 12, background: toast.type === "error" ? "#FF6B6B" : "#00C9A7", color: "#fff", fontSize: 14, fontWeight: 600, zIndex: 9999, animation: "toastIn 0.3s ease", fontFamily: "'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#1a1a2e", maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>📋 Results & Students</div>
          <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)" }}>Publish exam results · view students · track unattempted</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(26,26,46,0.04)", padding: 4, borderRadius: 12, width: "fit-content" }}>
          {[
            { key: "publish",     label: "📢 Publish Results"   },
            { key: "students",    label: "👨‍🎓 Students Overview" },
            { key: "unattempted", label: "😴 Unattempted"       },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#1a1a2e" : "rgba(26,26,46,0.5)", fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
            TAB 1 — PUBLISH RESULTS
        ══════════════════════════════ */}
        {activeTab === "publish" && (
          <>
            {allExams.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "1px solid rgba(26,26,46,0.08)", color: "rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>No locked exams yet</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Lock a paper first to publish results.</div>
              </div>
            ) : (
              <>
                <DeptSemSelector
                  dept={selectedDept} onDept={handleDeptSelect}
                  sem={selectedSem}   onSem={handleSemSelect}
                />

                {/* Step 3 — Exam */}
                {selectedSem && (
                  <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: "1px solid rgba(26,26,46,0.08)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.1em", marginBottom: 14 }}>
                      STEP 3 — SELECT EXAM
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: "#6C63FF" }}>
                        {DEPT_LABELS[selectedDept]} {selectedSem !== "ALL" ? `· Sem ${selectedSem}` : ""}
                      </span>
                    </div>
                    {examsForFilter(selectedDept, selectedSem).length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "rgba(26,26,46,0.4)", fontSize: 13 }}>
                        No exams for this filter
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {examsForFilter(selectedDept, selectedSem).map(exam => {
                          const isSelected = selectedExam?.id === exam.id;
                          return (
                            <button key={exam.id} className="sel-btn" onClick={() => handleExamSelect(exam)}
                              style={{ padding: "14px 20px", borderRadius: 12, border: isSelected ? "2px solid #FF6B6B" : "1px solid rgba(26,26,46,0.1)", background: isSelected ? "rgba(255,107,107,0.06)" : "#fff", textAlign: "left", minWidth: 170, cursor: "pointer" }}>
                              <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
                              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: isSelected ? "#FF6B6B" : "#1a1a2e" }}>
                                {exam.exam_name}
                              </div>
                              <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", marginTop: 4 }}>📅 {exam.exam_date}</div>
                              <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", marginTop: 2 }}>👨‍🎓 {exam.enrolled_students_count} enrolled</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Breadcrumb */}
                {selectedExam && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 12, color: "rgba(26,26,46,0.5)" }}>
                    <span style={{ cursor: "pointer", color: "#6C63FF" }}
                      onClick={() => { setSelectedDept(null); setSelectedSem(null); setSelectedExam(null); setExamData(null); setUnattemptedData(null); }}>
                      All Depts
                    </span>
                    <span>›</span>
                    <span style={{ cursor: "pointer", color: "#6C63FF" }}
                      onClick={() => { setSelectedSem(null); setSelectedExam(null); setExamData(null); setUnattemptedData(null); }}>
                      {DEPT_LABELS[selectedDept]}
                    </span>
                    <span>›</span>
                    <span style={{ cursor: "pointer", color: "#6C63FF" }}
                      onClick={() => { setSelectedExam(null); setExamData(null); setUnattemptedData(null); }}>
                      {selectedSem !== "ALL" ? `Semester ${selectedSem}` : "All Semesters"}
                    </span>
                    <span>›</span>
                    <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{selectedExam.exam_name}</span>
                  </div>
                )}

                {/* Step 4 — Results */}
                {selectedExam && (
                  detailLoading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "rgba(26,26,46,0.4)" }}>Loading results...</div>
                  ) : examData && (
                    <>
                      {/* ── Exam Summary Card ── */}
                      <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", marginBottom: 16, border: "1px solid rgba(26,26,46,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                          <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                              {examData.exam_name}
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {[
                                { icon: "📅", label: examData.exam_date,                                                            color: "rgba(26,26,46,0.55)" },
                                { icon: "🏛️", label: DEPT_LABELS[selectedDept] || selectedDept,                                     color: "rgba(26,26,46,0.55)" },
                                { icon: "👨‍🎓", label: `${examData.total_attempted} attempted`,                                      color: "#6C63FF"             },
                                { icon: "✅", label: `${examData.total_published} published`,                                        color: "#00C9A7"             },
                                { icon: "⏳", label: `${unpublishedCount} pending`,                                                  color: "#FFD166"             },
                                { icon: "❌", label: `${unattemptedData ? unattemptedData.total_unattempted : "..."} not attempted`, color: "#FF6B6B"             },
                              ].map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(26,26,46,0.03)", border: "1px solid rgba(26,26,46,0.06)" }}>
                                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── Publish Button / Blocking UI ── */}
                          {ongoing ? (
                            <div style={{ padding: "14px 20px", borderRadius: 14, background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.3)", color: "#FFD166", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: 24 }}>⏳</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>Exam In Progress</div>
                                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, color: "rgba(255,209,102,0.8)" }}>
                                  Publishing blocked · ~{timeLeft} min remaining
                                </div>
                              </div>
                            </div>
                          ) : unpublishedCount > 0 ? (
                            <button className="act-btn" onClick={handlePublishAll} disabled={publishing}
                              style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6C63FF,#5a54d4)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 20px rgba(108,99,255,0.4)", opacity: publishing ? 0.7 : 1, whiteSpace: "nowrap" }}>
                              {publishing ? "⏳ Publishing..." : `🚀 Publish Results (${unpublishedCount} students)`}
                            </button>
                          ) : examData.total_attempted > 0 ? (
                            <div style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.2)", color: "#00C9A7", fontWeight: 700, fontSize: 14 }}>
                              ✅ All Results Published!
                            </div>
                          ) : null}
                        </div>

                        {/* ── Mini unattempted preview ── */}
                        {unattemptedData && unattemptedData.total_unattempted > 0 && (
                          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.15)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6B6B", marginBottom: 8 }}>
                              😴 {unattemptedData.total_unattempted} student(s) did not attempt this exam:
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {unattemptedData.unattempted.slice(0, 8).map(s => (
                                <span key={s.id} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,107,107,0.1)", color: "#FF6B6B", fontWeight: 600 }}>
                                  {s.roll_number !== "—" ? s.roll_number : s.username}
                                </span>
                              ))}
                              {unattemptedData.total_unattempted > 8 && (
                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(26,26,46,0.06)", color: "rgba(26,26,46,0.5)", fontWeight: 600 }}>
                                  +{unattemptedData.total_unattempted - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Results Table */}
                      <div className="fade-up" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(26,26,46,0.08)" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(26,26,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700 }}>🏆 Student Results</div>
                          <div style={{ fontSize: 12, color: "rgba(26,26,46,0.4)" }}>{examData.students?.length || 0} students</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "50px 2fr 1fr 1fr 70px 120px", gap: 12, padding: "10px 24px", background: "rgba(26,26,46,0.02)", borderBottom: "1px solid rgba(26,26,46,0.06)" }}>
                          {["RANK", "STUDENT", "SCORE", "PERCENTAGE", "GRADE", "STATUS"].map(h => (
                            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.08em" }}>{h}</div>
                          ))}
                        </div>
                        {!examData.students || examData.students.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(26,26,46,0.4)" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700 }}>No students completed this exam yet</div>
                          </div>
                        ) : (
                          examData.students.map((std, i) => {
                            const gc = getGradeColor(std.percentage);
                            return (
                              <div key={i} className="std-row"
                                style={{ display: "grid", gridTemplateColumns: "50px 2fr 1fr 1fr 70px 120px", gap: 12, padding: "14px 24px", borderBottom: "1px solid rgba(26,26,46,0.04)", alignItems: "center" }}>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: i===0?"#FFD166":i===1?"#94a3b8":i===2?"#CD7F32":"rgba(26,26,46,0.3)" }}>
                                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(108,99,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👨‍🎓</div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{std.username}</div>
                                    <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)" }}>Roll: {std.roll_number}</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{std.score} / {std.total_marks}</div>
                                <div>
                                  <div style={{ height: 4, background: "rgba(26,26,46,0.08)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                                    <div style={{ height: "100%", background: gc, borderRadius: 2, width: `${std.percentage}%`, transition: "width 0.5s ease" }} />
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: gc }}>{std.percentage}%</div>
                                </div>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: gc }}>
                                  {getGrade(std.percentage)}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: std.is_published ? "rgba(0,201,167,0.1)" : "rgba(255,209,102,0.1)", color: std.is_published ? "#00C9A7" : "#FFD166", width: "fit-content" }}>
                                  {std.is_published ? "✅ Published" : "⏳ Pending"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════
            TAB 2 — STUDENTS OVERVIEW
        ══════════════════════════════ */}
        {activeTab === "students" && (
          <>
            <DeptSemSelector
              dept={selectedDept} onDept={handleDeptSelect}
              sem={selectedSem}   onSem={handleSemSelect}
            />
            {!selectedDept && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>Select a department to view students</div>
              </div>
            )}
            {selectedDept && !selectedSem && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Now select a semester</div>
              </div>
            )}
            {selectedSem && (
              <>
                <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Total Students", value: studentsForFilter.length,                            color: "#6C63FF", icon: "👨‍🎓" },
                    { label: "Active",          value: studentsForFilter.filter(s => s.is_active).length,  color: "#00C9A7", icon: "✅"   },
                    { label: "Inactive",        value: studentsForFilter.filter(s => !s.is_active).length, color: "#FF6B6B", icon: "🚫"   },
                    { label: "Exams in Filter", value: examsForFilter(selectedDept, selectedSem).length,   color: "#FFD166", icon: "📝"   },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: `1px solid ${s.color}22` }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "rgba(26,26,46,0.45)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="fade-up" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(26,26,46,0.08)" }}>
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(26,26,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700 }}>
                      👨‍🎓 {DEPT_LABELS[selectedDept]} {selectedSem !== "ALL" ? `— Semester ${selectedSem}` : "— All Semesters"}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(26,26,46,0.4)" }}>{studentsForFilter.length} students</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 90px 30px", gap: 12, padding: "10px 24px", background: "rgba(26,26,46,0.02)", borderBottom: "1px solid rgba(26,26,46,0.06)" }}>
                    {["#", "STUDENT", "ROLL NO", "DEPT", "SEM", "STATUS", ""].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.08em" }}>{h}</div>
                    ))}
                  </div>
                  {studentsForFilter.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(26,26,46,0.4)" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700 }}>No students found</div>
                    </div>
                  ) : (
                    studentsForFilter.map((stu, i) => {
                      const isExpanded = expandedStudent === stu.id;
                      return (
                        <div key={stu.id}>
                          <div className="stu-row"
                            onClick={() => setExpandedStudent(isExpanded ? null : stu.id)}
                            style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr 90px 30px", gap: 12, padding: "14px 24px", borderBottom: isExpanded ? "none" : "1px solid rgba(26,26,46,0.04)", alignItems: "center", background: isExpanded ? "rgba(108,99,255,0.03)" : "transparent" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,46,0.3)" }}>#{i+1}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: stu.is_active ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👨‍🎓</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: stu.is_active ? "#1a1a2e" : "rgba(26,26,46,0.4)" }}>{stu.username}</div>
                                <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)" }}>{stu.email || "—"}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{stu.roll_number || "—"}</div>
                            <div style={{ fontSize: 12, color: "rgba(26,26,46,0.6)" }}>{DEPT_LABELS[stu.department] || stu.department}</div>
                            <div style={{ fontSize: 12, color: "rgba(26,26,46,0.6)" }}>Sem {stu.semester || "—"}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: stu.is_active ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", color: stu.is_active ? "#00C9A7" : "#FF6B6B", width: "fit-content" }}>
                              {stu.is_active ? "✅ Active" : "🚫 Inactive"}
                            </span>
                            <div style={{ fontSize: 16, color: "rgba(26,26,46,0.35)", textAlign: "center", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "none" }}>›</div>
                          </div>
                          {isExpanded && (
                            <div className="fade-up" style={{ padding: "16px 24px 20px 80px", background: "rgba(108,99,255,0.02)", borderBottom: "1px solid rgba(26,26,46,0.06)" }}>
                              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#6C63FF" }}>
                                📚 Enrolled Exams
                              </div>
                              {examsForFilter(selectedDept, selectedSem).length === 0 ? (
                                <div style={{ fontSize: 13, color: "rgba(26,26,46,0.4)", padding: "12px 0" }}>No exams in this filter</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {examsForFilter(selectedDept, selectedSem).map(exam => (
                                    <div key={exam.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#fff", borderRadius: 10, border: "1px solid rgba(26,26,46,0.08)" }}>
                                      <div style={{ fontSize: 18 }}>📝</div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{exam.exam_name}</div>
                                        <div style={{ fontSize: 11, color: "rgba(26,26,46,0.45)", marginTop: 2 }}>
                                          📅 {exam.exam_date} · ⏰ {exam.start_time} · ⏱️ {exam.duration_minutes} mins
                                        </div>
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(108,99,255,0.08)", color: "#6C63FF" }}>🔒 Locked</span>
                                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(26,26,46,0.05)", color: "rgba(26,26,46,0.5)" }}>👨‍🎓 {exam.enrolled_students_count} enrolled</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════
            TAB 3 — UNATTEMPTED
        ══════════════════════════════ */}
        {activeTab === "unattempted" && (
          <>
            <DeptSemSelector
              dept={unaDept} onDept={(d) => { setUnaDept(d); setUnaSem(null); setUnaExam(null); setUnaDetail(null); }}
              sem={unaSem}   onSem={(s) => { setUnaSem(s); setUnaExam(null); setUnaDetail(null); }}
            />
            {unaSem && (
              <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: "1px solid rgba(26,26,46,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.1em", marginBottom: 14 }}>
                  STEP 3 — SELECT EXAM
                </div>
                {examsForFilter(unaDept, unaSem).length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "rgba(26,26,46,0.4)", fontSize: 13 }}>No exams for this filter</div>
                ) : (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {examsForFilter(unaDept, unaSem).map(exam => {
                      const isSel = unaExam?.id === exam.id;
                      return (
                        <button key={exam.id} className="sel-btn"
                          onClick={() => { setUnaExam(exam); fetchUnaDetail(exam.id); }}
                          style={{ padding: "14px 20px", borderRadius: 12, border: isSel ? "2px solid #FF6B6B" : "1px solid rgba(26,26,46,0.1)", background: isSel ? "rgba(255,107,107,0.06)" : "#fff", textAlign: "left", minWidth: 170, cursor: "pointer" }}>
                          <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: isSel ? "#FF6B6B" : "#1a1a2e" }}>{exam.exam_name}</div>
                          <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", marginTop: 4 }}>📅 {exam.exam_date}</div>
                          <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", marginTop: 2 }}>👨‍🎓 {exam.enrolled_students_count} enrolled</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {unaExam && (
              unaDetailLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(26,26,46,0.4)" }}>Loading...</div>
              ) : unaDetail && (
                <>
                  <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Total Enrolled", value: unaDetail.total_enrolled,    color: "#6C63FF", icon: "👨‍🎓" },
                      { label: "Attempted",       value: unaDetail.total_attempted,   color: "#00C9A7", icon: "✅"   },
                      { label: "Did Not Attempt", value: unaDetail.total_unattempted, color: "#FF6B6B", icon: "😴"   },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: `1px solid ${s.color}22`, display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: s.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{s.icon}</div>
                        <div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 12, color: "rgba(26,26,46,0.45)", marginTop: 2 }}>{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="fade-up" style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1px solid rgba(26,26,46,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                      <span style={{ color: "#00C9A7" }}>✅ Attempted: {unaDetail.total_attempted}</span>
                      <span style={{ color: "#FF6B6B" }}>😴 Not attempted: {unaDetail.total_unattempted}</span>
                    </div>
                    <div style={{ height: 10, background: "rgba(26,26,46,0.06)", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,#00C9A7,#6C63FF)", borderRadius: 5, width: `${unaDetail.total_enrolled > 0 ? (unaDetail.total_attempted / unaDetail.total_enrolled) * 100 : 0}%`, transition: "width 0.8s ease" }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "rgba(26,26,46,0.4)", textAlign: "right" }}>
                      {unaDetail.total_enrolled > 0 ? Math.round((unaDetail.total_attempted / unaDetail.total_enrolled) * 100) : 0}% participation rate
                    </div>
                  </div>
                  {unaDetail.total_unattempted === 0 ? (
                    <div className="fade-up" style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px solid rgba(0,201,167,0.2)" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: "#00C9A7" }}>All students attempted!</div>
                      <div style={{ fontSize: 13, color: "rgba(26,26,46,0.4)", marginTop: 8 }}>100% participation for this exam.</div>
                    </div>
                  ) : (
                    <div className="fade-up" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,107,107,0.15)" }}>
                      <div style={{ padding: "14px 24px", background: "rgba(255,107,107,0.04)", borderBottom: "1px solid rgba(255,107,107,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>😴</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#FF6B6B" }}>
                          Did Not Attempt ({unaDetail.total_unattempted})
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr", gap: 12, padding: "10px 24px", background: "rgba(26,26,46,0.02)", borderBottom: "1px solid rgba(26,26,46,0.06)" }}>
                        {["#", "STUDENT", "ROLL NO", "DEPT", "SEM"].map(h => (
                          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(26,26,46,0.4)", letterSpacing: "0.08em" }}>{h}</div>
                        ))}
                      </div>
                      {unaDetail.unattempted.map((s, i) => (
                        <div key={s.id} style={{ display: "grid", gridTemplateColumns: "40px 2fr 1fr 1fr 1fr", gap: 12, padding: "14px 24px", borderBottom: "1px solid rgba(26,26,46,0.04)", alignItems: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,46,0.3)" }}>#{i+1}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>😴</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.username}</div>
                              <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)" }}>{s.email || "—"}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.roll_number}</div>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(0,201,167,0.08)", color: "#00C9A7" }}>
                              {s.department}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(108,99,255,0.08)", color: "#6C63FF" }}>
                              Sem {s.semester}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
            {!unaDept && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>Select dept → semester → exam to see who didn't attempt</div>
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
};

export default AdminPublishResults;