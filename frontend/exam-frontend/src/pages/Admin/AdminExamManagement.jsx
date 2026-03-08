import React, { useState, useEffect } from "react";
import api from "../../services/api";

const STATUS_CONFIG = {
  DRAFT:     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: "Draft"     },
  SUBMITTED: { color: "#FFD166", bg: "rgba(255,209,102,0.1)", label: "Submitted" },
  APPROVED:  { color: "#00C9A7", bg: "rgba(0,201,167,0.1)",  label: "Approved"  },
  LOCKED:    { color: "#6C63FF", bg: "rgba(108,99,255,0.1)", label: "Locked"    },
  REJECTED:  { color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", label: "Rejected" },
};

const AdminExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [toast, setToast] = useState(null);

  // Enroll states
  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollStudents, setEnrollStudents] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [semFilter, setSemFilter] = useState("ALL");

  // ── NEW: Edit states ──
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const [form, setForm] = useState({
    exam_name: "", exam_date: "", start_time: "",
    duration_minutes: "", total_questions_allowed: 10,
    marks_correct: 4, marks_wrong: -1, assigned_staff: "",
    department: "CS", semester: "1",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [examsRes, staffRes] = await Promise.all([
        api.get("/api/exams/"),
        api.get("/api/admin/staff/"),
      ]);
      setExams(examsRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    try {
      await api.post("/api/exams/create/", form);
      showToast("Exam created successfully! ✅");
      setShowCreate(false);
      setForm({
        exam_name: "", exam_date: "", start_time: "",
        duration_minutes: "", total_questions_allowed: 10,
        marks_correct: 4, marks_wrong: -1, assigned_staff: "",
        department: "CS", semester: "1",
      });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create exam", "error");
    }
  };

  const handleApprove = async (examId) => {
    try {
      await api.post(`/api/exams/${examId}/approve/`);
      showToast("Exam approved! ✅");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to approve", "error");
    }
  };

  const handleReject = async (examId) => {
    try {
      await api.post(`/api/exams/${examId}/reject/`);
      showToast("Exam rejected ❌");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reject", "error");
    }
  };

  // ── NEW: Edit handlers ──
  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await api.put(`/api/exams/${editModal.id}/update/`, editForm);
      showToast("Exam updated! ✅");
      setEditModal(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update!", "error");
    } finally {
      setEditSaving(false);
    }
  };

  // ── NEW: Resync enrollment ──
  const handleResync = async (examId) => {
    try {
      const res = await api.post(`/api/exams/${examId}/resync-enrollment/`);
      showToast(`✅ ${res.data.message}`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to resync!", "error");
    }
  };

  // Enroll handlers
  const fetchEnrollStudents = async (examId) => {
    setEnrollLoading(true);
    try {
      const res = await api.get(`/api/exams/${examId}/enroll/`);
      setEnrollStudents(res.data);
    } catch (err) {
      showToast("Failed to load students", "error");
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollToggle = (studentId) => {
    setEnrollStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, enrolled: !s.enrolled } : s)
    );
  };

  const handleSelectByFilter = () => {
    setEnrollStudents(prev =>
      prev.map(s => {
        const deptMatch = deptFilter === "ALL" || s.department === deptFilter;
        const semMatch  = semFilter  === "ALL" || s.semester  === semFilter;
        return (deptMatch && semMatch) ? { ...s, enrolled: true } : s;
      })
    );
  };

  const handleSaveEnroll = async () => {
    setEnrollSaving(true);
    try {
      const ids = enrollStudents.filter(s => s.enrolled).map(s => s.id);
      await api.post(`/api/exams/${enrollModal.id}/enroll/`, { student_ids: ids });
      showToast(`${ids.length} students enrolled! ✅`);
      setEnrollModal(null);
      setDeptFilter("ALL");
      setSemFilter("ALL");
      fetchAll();
    } catch (err) {
      showToast("Failed to save enrollment", "error");
    } finally {
      setEnrollSaving(false);
    }
  };

  const filteredExams = filter === "ALL"
    ? exams
    : exams.filter(e => e.workflow_status === filter);

  const visibleEnrollStudents = enrollStudents.filter(s => {
    const deptMatch = deptFilter === "ALL" || s.department === deptFilter;
    const semMatch  = semFilter  === "ALL" || s.semester  === semFilter;
    return deptMatch && semMatch;
  });

  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderIcon}>📋</div>
      <div style={s.loaderText}>Loading Exams...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .exam-card { animation: fadeUp 0.3s ease both; transition: all 0.2s; }
        .exam-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(108,99,255,0.1); }
        .action-btn { transition: all 0.15s; }
        .action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        input:focus, select:focus { outline: none; border-color: #6C63FF !important; }
        .filter-btn { transition: all 0.15s; }
        .filter-btn:hover { border-color: #6C63FF !important; color: #6C63FF !important; }
        .enroll-row { transition: all 0.15s; cursor: pointer; }
        .enroll-row:hover { background: rgba(108,99,255,0.05) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "error" ? "#FF6B6B" : "#00C9A7", animation:"toastIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={s.root}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.pageTitle}>📋 Exam Management</div>
            <div style={s.pageSubtitle}>{exams.length} total exams</div>
          </div>
          <button className="action-btn" onClick={() => setShowCreate(true)} style={s.createBtn}>
            ➕ Create New Exam
          </button>
        </div>

        {/* Filter Bar */}
        <div style={s.filterBar}>
          {["ALL","DRAFT","SUBMITTED","APPROVED","LOCKED","REJECTED"].map(f => (
            <button key={f} className="filter-btn" onClick={() => setFilter(f)}
              style={{ ...s.filterBtn, background: filter===f ? "#6C63FF" : "transparent", color: filter===f ? "#fff" : "rgba(26,26,46,0.6)", border: filter===f ? "1px solid #6C63FF" : "1px solid rgba(26,26,46,0.15)" }}>
              {f === "ALL" ? `All (${exams.length})` : `${f} (${exams.filter(e=>e.workflow_status===f).length})`}
            </button>
          ))}
        </div>

        {/* Exams Grid */}
        {filteredExams.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600 }}>No exams found</div>
            <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginTop:4 }}>Create your first exam to get started!</div>
          </div>
        ) : (
          <div style={s.grid}>
            {filteredExams.map((exam, i) => {
              const statusKey = exam.workflow_status || "DRAFT";
              const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.DRAFT;
              return (
                <div key={exam.id} className="exam-card" style={{ ...s.examCard, animationDelay:`${i*0.06}s` }}>

                  {/* Card Header */}
                  <div style={s.cardTop}>
                    <div style={s.examIcon}>📝</div>
                    <span style={{ ...s.statusBadge, color:sc.color, background:sc.bg, border:`1px solid ${sc.color}33` }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Exam Name */}
                  <div style={s.examName}>{exam.exam_name}</div>

                  {/* Details */}
                  <div style={s.detailsGrid}>
                    <div style={s.detail}><span style={s.detailIcon}>📅</span><span>{exam.exam_date}</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>⏰</span><span>{exam.start_time}</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>⏱️</span><span>{exam.duration} min</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>👨‍🏫</span><span>{exam.assigned_staff || "Not assigned"}</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>🏛️</span><span>{exam.department === "ALL" ? "All Depts" : exam.department}</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>📚</span><span>{exam.semester ? `Sem ${exam.semester}` : "All Sems"}</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>❓</span><span>{exam.total_questions_allowed} questions</span></div>
                    <div style={s.detail}><span style={s.detailIcon}>👨‍🎓</span><span>{exam.enrolled_students_count || 0} enrolled</span></div>
                  </div>

                  <div style={s.divider} />

                  {/* Actions */}
                  <div style={s.actions}>

                    {/* Approve / Reject */}
                    {statusKey === "SUBMITTED" && (
                      <>
                        <button className="action-btn" onClick={() => handleApprove(exam.id)} style={{ ...s.btn, ...s.btnApprove }}>✅ Approve</button>
                        <button className="action-btn" onClick={() => handleReject(exam.id)}  style={{ ...s.btn, ...s.btnReject }}>❌ Reject</button>
                      </>
                    )}

                    {/* Enroll Students */}
                    {statusKey !== "LOCKED" && (
                      <button className="action-btn"
                        onClick={() => { setEnrollModal(exam); setDeptFilter("ALL"); setSemFilter("ALL"); fetchEnrollStudents(exam.id); }}
                        style={{ ...s.btn, ...s.btnEnroll }}>
                        👨‍🎓 Enroll
                      </button>
                    )}

                    {/* ── NEW: Resync Enrollment ── */}
                    {statusKey !== "LOCKED" && (
                      <button className="action-btn"
                        onClick={() => handleResync(exam.id)}
                        style={{ ...s.btn, background:"rgba(0,201,167,0.1)", color:"#00C9A7" }}>
                        🔄 Resync
                      </button>
                    )}

                    {/* ── NEW: Edit Exam ── */}
                    {statusKey !== "LOCKED" && (
                      <button className="action-btn"
                        onClick={() => {
                          setEditModal(exam);
                          setEditForm({
                            exam_name:               exam.exam_name,
                            exam_date:               exam.exam_date,
                            start_time:              exam.start_time,
                            duration_minutes:        exam.duration,
                            total_questions_allowed: exam.total_questions_allowed,
                            marks_correct:           exam.marks_correct,
                            marks_wrong:             exam.marks_wrong,
                          });
                        }}
                        style={{ ...s.btn, background:"rgba(108,99,255,0.08)", color:"#6C63FF" }}>
                        ✏️ Edit
                      </button>
                    )}

                    {statusKey === "LOCKED" && (
                      <div style={s.lockedBadge}>🔒 Locked on Blockchain</div>
                    )}
                    {statusKey === "DRAFT" && (
                      <div style={s.draftNote}>⏳ Waiting for staff submission</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE EXAM MODAL ── */}
      {showCreate && (
        <div style={s.overlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...s.modal, maxWidth:680 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>➕ Create New Exam</div>
              <button onClick={() => setShowCreate(false)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.formGrid}>
              <div style={{ ...s.formGroup, gridColumn:"1 / -1" }}>
                <label style={s.label}>Exam Name *</label>
                <input style={s.input} placeholder="e.g. Mathematics Final Exam"
                  value={form.exam_name} onChange={e => setForm({...form, exam_name: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Assign Staff *</label>
                <select style={s.input} value={form.assigned_staff}
                  onChange={e => setForm({...form, assigned_staff: e.target.value})}>
                  <option value="">Select Staff</option>
                  {staff.map(st => <option key={st.id} value={st.id}>{st.username}</option>)}
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Department *</label>
                <select style={s.input} value={form.department}
                  onChange={e => setForm({...form, department: e.target.value})}>
                  <option value="ALL">All Departments</option>
                  {[["CS","Computer Science"],["ECE","Electronics"],["MECH","Mechanical"],["CIVIL","Civil"],["MBA","MBA"]].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Semester *</label>
                <select style={s.input} value={form.semester}
                  onChange={e => setForm({...form, semester: e.target.value})}>
                  <option value="">All Semesters</option>
                  {["1","2","3","4","5","6","7","8"].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Exam Date *</label>
                <input style={s.input} type="date" value={form.exam_date}
                  onChange={e => setForm({...form, exam_date: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Start Time *</label>
                <input style={s.input} type="time" value={form.start_time}
                  onChange={e => setForm({...form, start_time: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Duration (minutes) *</label>
                <input style={s.input} type="number" placeholder="e.g. 60"
                  value={form.duration_minutes}
                  onChange={e => setForm({...form, duration_minutes: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Total Questions *</label>
                <input style={s.input} type="number" value={form.total_questions_allowed}
                  onChange={e => setForm({...form, total_questions_allowed: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Correct</label>
                <input style={s.input} type="number" value={form.marks_correct}
                  onChange={e => setForm({...form, marks_correct: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Wrong</label>
                <input style={s.input} type="number" value={form.marks_wrong}
                  onChange={e => setForm({...form, marks_wrong: e.target.value})} />
              </div>
            </div>

            <div style={{ padding:"12px 16px", background:"rgba(0,201,167,0.06)", border:"1px solid rgba(0,201,167,0.15)", borderRadius:10, marginBottom:20, fontSize:13, color:"rgba(26,26,46,0.6)", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>ℹ️</span>
              <span>
                Students from <strong>{form.department === "ALL" ? "All Departments" : form.department}</strong>
                {form.semester ? `, Semester ${form.semester}` : ", All Semesters"} will be
                <strong> automatically enrolled</strong> when exam is created!
              </span>
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} style={s.submitBtn}>➕ Create Exam</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: EDIT EXAM MODAL ── */}
      {editModal && (
        <div style={s.overlay} onClick={() => setEditModal(null)}>
          <div style={{ ...s.modal, maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>✏️ Edit Exam</div>
                <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginTop:2 }}>{editModal.exam_name}</div>
              </div>
              <button onClick={() => setEditModal(null)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.formGrid}>
              <div style={{ ...s.formGroup, gridColumn:"1 / -1" }}>
                <label style={s.label}>Exam Name *</label>
                <input style={s.input} value={editForm.exam_name || ""}
                  onChange={e => setEditForm({...editForm, exam_name: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Exam Date *</label>
                <input style={s.input} type="date" value={editForm.exam_date || ""}
                  onChange={e => setEditForm({...editForm, exam_date: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Start Time *</label>
                <input style={s.input} type="time" value={editForm.start_time || ""}
                  onChange={e => setEditForm({...editForm, start_time: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Duration (minutes) *</label>
                <input style={s.input} type="number" value={editForm.duration_minutes || ""}
                  onChange={e => setEditForm({...editForm, duration_minutes: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Total Questions *</label>
                <input style={s.input} type="number" value={editForm.total_questions_allowed || ""}
                  onChange={e => setEditForm({...editForm, total_questions_allowed: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Correct</label>
                <input style={s.input} type="number" value={editForm.marks_correct || ""}
                  onChange={e => setEditForm({...editForm, marks_correct: e.target.value})} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Marks per Wrong</label>
                <input style={s.input} type="number" value={editForm.marks_wrong || ""}
                  onChange={e => setEditForm({...editForm, marks_wrong: e.target.value})} />
              </div>
            </div>

            {/* Warning */}
            <div style={{ padding:"10px 14px", background:"rgba(255,209,102,0.08)", border:"1px solid rgba(255,209,102,0.25)", borderRadius:10, fontSize:12, color:"rgba(46,26,26,0.6)", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
              <span>⚠️</span>
              <span>Department and semester cannot be changed. Use <strong>🔄 Resync</strong> to update student enrollment.</span>
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setEditModal(null)} style={s.cancelBtn}>Cancel</button>
              <button className="action-btn" onClick={handleEditSave} disabled={editSaving}
                style={{ ...s.submitBtn, opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENROLL STUDENTS MODAL ── */}
      {enrollModal && (
        <div style={s.overlay} onClick={() => setEnrollModal(null)}>
          <div style={{ ...s.modal, maxWidth:680, display:"flex", flexDirection:"column" }}
            onClick={e => e.stopPropagation()}>

            <div style={s.modalHeader}>
              <div>
                <div style={s.modalTitle}>👨‍🎓 Enroll Students</div>
                <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginTop:2 }}>{enrollModal.exam_name}</div>
              </div>
              <button onClick={() => setEnrollModal(null)} style={s.closeBtn}>✕</button>
            </div>

            {/* Filters */}
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ ...s.input, flex:1, minWidth:160 }}>
                <option value="ALL">All Departments</option>
                {[["CS","Computer Science"],["ECE","Electronics"],["MECH","Mechanical"],["CIVIL","Civil"],["MBA","MBA"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <select value={semFilter} onChange={e => setSemFilter(e.target.value)} style={{ ...s.input, flex:1, minWidth:140 }}>
                <option value="ALL">All Semesters</option>
                {["1","2","3","4","5","6","7","8"].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <button className="action-btn" onClick={handleSelectByFilter}
                style={{ ...s.btn, background:"#6C63FF", color:"#fff", padding:"10px 16px", boxShadow:"0 4px 12px rgba(108,99,255,0.3)" }}>
                ✅ Select Filtered
              </button>
              <button className="action-btn"
                onClick={() => setEnrollStudents(prev => prev.map(s => ({...s, enrolled:false})))}
                style={{ ...s.btn, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", color:"rgba(26,26,46,0.6)", padding:"10px 16px" }}>
                ✕ Clear All
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              {[
                { label:"Total",    value:enrollStudents.length,                       color:"#6C63FF" },
                { label:"Showing",  value:visibleEnrollStudents.length,                color:"#FFD166" },
                { label:"Selected", value:enrollStudents.filter(s=>s.enrolled).length, color:"#00C9A7" },
              ].map((item, i) => (
                <div key={i} style={{ padding:"8px 16px", borderRadius:10, background:`${item.color}10`, border:`1px solid ${item.color}22`, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:item.color }}>{item.value}</span>
                  <span style={{ fontSize:12, color:"rgba(26,26,46,0.45)" }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Student List */}
            <div style={{ flex:1, overflowY:"auto", border:"1px solid rgba(26,26,46,0.08)", borderRadius:12, marginBottom:16, maxHeight:340 }}>
              {enrollLoading ? (
                <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.4)" }}>Loading students...</div>
              ) : visibleEnrollStudents.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>No students found</div>
                  <div style={{ fontSize:12, marginTop:4 }}>Try changing the department or semester filter</div>
                </div>
              ) : (
                visibleEnrollStudents.map((st) => (
                  <div key={st.id} className="enroll-row"
                    onClick={() => handleEnrollToggle(st.id)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderBottom:"1px solid rgba(26,26,46,0.05)", background: st.enrolled ? "rgba(0,201,167,0.04)" : "transparent" }}>
                    <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${st.enrolled ? "#00C9A7" : "rgba(26,26,46,0.2)"}`, background: st.enrolled ? "#00C9A7" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:800, flexShrink:0, transition:"all 0.15s" }}>
                      {st.enrolled && "✓"}
                    </div>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👨‍🎓</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e" }}>{st.username}</div>
                      <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)" }}>Roll: {st.roll_number || "—"} · {st.email}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, background:"rgba(108,99,255,0.08)", color:"#6C63FF", marginBottom:2 }}>{st.department}</div>
                      <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)" }}>Sem {st.semester}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={s.modalFooter}>
              <button onClick={() => setEnrollModal(null)} style={s.cancelBtn}>Cancel</button>
              <button className="action-btn" onClick={handleSaveEnroll} disabled={enrollSaving}
                style={{ ...s.submitBtn, background:"#00C9A7", boxShadow:"0 4px 12px rgba(0,201,167,0.3)", opacity: enrollSaving ? 0.7 : 1 }}>
                {enrollSaving ? "Saving..." : `✅ Enroll ${enrollStudents.filter(s=>s.enrolled).length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const s = {
  root:        { fontFamily:"'DM Sans', sans-serif", color:"#1a1a2e", maxWidth:1200 },
  loader:      { minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 },
  loaderIcon:  { fontSize:48 },
  loaderText:  { fontSize:16, color:"rgba(26,26,46,0.5)" },
  pageHeader:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 },
  pageTitle:   { fontFamily:"'Syne', sans-serif", fontSize:28, fontWeight:800, color:"#1a1a2e", marginBottom:4 },
  pageSubtitle:{ fontSize:13, color:"rgba(26,26,46,0.45)" },
  createBtn:   { padding:"12px 24px", background:"#6C63FF", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans', sans-serif", boxShadow:"0 4px 16px rgba(108,99,255,0.3)", transition:"all 0.2s" },
  filterBar:   { display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" },
  filterBtn:   { padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif" },
  grid:        { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 },
  examCard:    { background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:"20px", cursor:"default" },
  cardTop:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 },
  examIcon:    { width:40, height:40, borderRadius:10, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  statusBadge: { fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", padding:"4px 10px", borderRadius:20 },
  examName:    { fontFamily:"'Syne', sans-serif", fontSize:17, fontWeight:700, color:"#1a1a2e", marginBottom:14 },
  detailsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 },
  detail:      { display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(26,26,46,0.6)", background:"rgba(26,26,46,0.03)", padding:"6px 10px", borderRadius:8 },
  detailIcon:  { fontSize:13 },
  divider:     { height:1, background:"rgba(26,26,46,0.06)", marginBottom:14 },
  actions:     { display:"flex", gap:8, flexWrap:"wrap" },
  btn:         { padding:"8px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif" },
  btnApprove:  { background:"rgba(0,201,167,0.12)", color:"#00C9A7" },
  btnReject:   { background:"rgba(255,107,107,0.12)", color:"#FF6B6B" },
  btnEnroll:   { background:"rgba(108,99,255,0.1)", color:"#6C63FF" },
  lockedBadge: { fontSize:12, color:"#6C63FF", fontWeight:600, background:"rgba(108,99,255,0.08)", padding:"6px 12px", borderRadius:8 },
  draftNote:   { fontSize:12, color:"rgba(26,26,46,0.4)", fontWeight:500, padding:"6px 12px", borderRadius:8, background:"rgba(26,26,46,0.04)" },
  empty:       { textAlign:"center", padding:"80px 20px", color:"rgba(26,26,46,0.4)" },
  overlay:     { position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" },
  modal:       { background:"#fff", borderRadius:20, padding:"28px", width:"90%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" },
  modalHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 },
  modalTitle:  { fontFamily:"'Syne', sans-serif", fontSize:20, fontWeight:800, color:"#1a1a2e" },
  closeBtn:    { background:"rgba(26,26,46,0.06)", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, color:"#1a1a2e" },
  formGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 },
  formGroup:   { display:"flex", flexDirection:"column", gap:6 },
  label:       { fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.6)", letterSpacing:"0.05em" },
  input:       { padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, color:"#1a1a2e", fontFamily:"'DM Sans', sans-serif", background:"#fff", transition:"border-color 0.15s" },
  modalFooter: { display:"flex", gap:12, justifyContent:"flex-end" },
  cancelBtn:   { padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, color:"rgba(26,26,46,0.6)", fontFamily:"'DM Sans', sans-serif" },
  submitBtn:   { padding:"10px 24px", borderRadius:8, background:"#6C63FF", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans', sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)" },
  toast:       { position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.15)" },
};

export default AdminExamManagement;
