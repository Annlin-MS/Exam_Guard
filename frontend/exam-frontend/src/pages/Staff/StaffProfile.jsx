import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email:"", password:"", confirm_password:"" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, examsRes] = await Promise.all([
        api.get("/api/staff/profile/"),
        api.get("/api/exams/"),
      ]);
      setProfile({ ...profileRes.data, exams: examsRes.data });
      setForm({ email: profileRes.data.email, password:"", confirm_password:"" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (form.password && form.password !== form.confirm_password) {
      showToast("Passwords don't match!", "error"); return;
    }
    setSaving(true);
    try {
      const payload = { email: form.email };
      if (form.password) payload.password = form.password;
      await api.put("/api/staff/profile/", payload);
      showToast("Profile updated! ✅");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      showToast("Failed to update!", "error");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_CONFIG = {
    DRAFT:     { color:"#94a3b8", label:"Draft"     },
    SUBMITTED: { color:"#FFD166", label:"Submitted" },
    APPROVED:  { color:"#00C9A7", label:"Approved"  },
    REJECTED:  { color:"#FF6B6B", label:"Rejected"  },
    LOCKED:    { color:"#6C63FF", label:"Locked"    },
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  const exams = profile?.exams || [];
  const examStats = {
    total:     exams.length,
    draft:     exams.filter(e=>e.workflow_status==="DRAFT").length,
    submitted: exams.filter(e=>e.workflow_status==="SUBMITTED").length,
    approved:  exams.filter(e=>e.workflow_status==="APPROVED").length,
    locked:    exams.filter(e=>e.workflow_status==="LOCKED").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        input:focus { outline:none; border-color:#00C9A7 !important; box-shadow:0 0 0 3px rgba(0,201,167,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:800 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>👤 My Profile</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Manage your account details</div>
        </div>

        {/* Profile Card */}
        <div className="fade-up" style={{ background:"#fff", borderRadius:20, overflow:"hidden", border:"1px solid rgba(0,201,167,0.1)", marginBottom:20 }}>

          {/* Banner */}
          <div style={{ background:"linear-gradient(135deg,#00C9A7,#00a187)", padding:"32px 28px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", fontSize:100, opacity:0.08 }}>👨‍🏫</div>
            <div style={{ width:64, height:64, borderRadius:18, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:14, border:"2px solid rgba(255,255,255,0.3)" }}>
              👨‍🏫
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>
              {profile?.username}
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>{profile?.email}</div>
            <div style={{ marginTop:10 }}>
              <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:700 }}>
                STAFF
              </span>
            </div>
          </div>

          {/* Exam Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:0, borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
            {[
              { label:"Total",     value:examStats.total,     color:"#6C63FF" },
              { label:"Draft",     value:examStats.draft,     color:"#94a3b8" },
              { label:"Submitted", value:examStats.submitted, color:"#FFD166" },
              { label:"Approved",  value:examStats.approved,  color:"#00C9A7" },
              { label:"Locked",    value:examStats.locked,    color:"#6C63FF" },
            ].map((s,i) => (
              <div key={i} style={{ padding:"16px", textAlign:"center", borderRight: i<4 ? "1px solid rgba(26,26,46,0.06)" : "none" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Info + Edit */}
          <div style={{ padding:28 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
              {[
                { icon:"👤", label:"Username", value:profile?.username },
                { icon:"📧", label:"Email",    value:profile?.email    },
                { icon:"🎭", label:"Role",     value:"Staff"           },
                { icon:"📋", label:"Total Exams Assigned", value:examStats.total },
              ].map((item,i) => (
                <div key={i} style={{ padding:"14px 16px", background:"rgba(0,201,167,0.03)", borderRadius:12, border:"1px solid rgba(0,201,167,0.08)" }}>
                  <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                    <span>{item.icon}</span>{item.label}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {!editing ? (
              <button className="act-btn" onClick={() => setEditing(true)}
                style={{ padding:"11px 24px", borderRadius:10, border:"none", background:"#00C9A7", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ background:"rgba(0,201,167,0.03)", border:"1px solid rgba(0,201,167,0.1)", borderRadius:14, padding:20 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>✏️ Update Profile</div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[
                    { label:"Email", key:"email", type:"email", placeholder:"your@email.com" },
                    { label:"New Password (leave blank to keep)", key:"password", type:"password", placeholder:"New password" },
                    { label:"Confirm Password", key:"confirm_password", type:"password", placeholder:"Confirm password" },
                  ].map(field => (
                    <div key={field.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.6)" }}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                        onChange={e => setForm({...form, [field.key]: e.target.value})}
                        style={{ padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:12, marginTop:16 }}>
                  <button onClick={() => setEditing(false)}
                    style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                  <button className="act-btn" onClick={handleSave} disabled={saving}
                    style={{ padding:"10px 24px", borderRadius:8, background:"#00C9A7", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", opacity:saving?0.7:1 }}>
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="fade-up" style={{ background:"#fff", borderRadius:16, border:"1px solid rgba(0,201,167,0.08)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>📋 My Exams</div>
          </div>
          {exams.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:14, fontWeight:600 }}>No exams assigned yet</div>
            </div>
          ) : (
            exams.map((exam,i) => {
              const sc = STATUS_CONFIG[exam.workflow_status] || STATUS_CONFIG.DRAFT;
              return (
                <div key={exam.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)" }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${sc.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📝</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{exam.exam_name}</div>
                    <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginTop:2 }}>📅 {exam.exam_date} · ⏰ {exam.start_time}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${sc.color}15`, color:sc.color }}>
                    {sc.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default StaffProfile;