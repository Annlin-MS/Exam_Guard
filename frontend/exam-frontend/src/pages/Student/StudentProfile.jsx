import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email:"", password:"", confirm_password:"" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/student/profile/");
      setProfile(res.data);
      setForm({ email: res.data.email, password:"", confirm_password:"" });
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
      await api.put("/api/student/profile/", payload);
      showToast("Profile updated! ✅");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      showToast("Failed to update!", "error");
    } finally {
      setSaving(false);
    }
  };

  const DEPT_LABELS = {
    CS:"Computer Science", ECE:"Electronics",
    MECH:"Mechanical", CIVIL:"Civil", MBA:"MBA", "—":"—"
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        input:focus { outline:none; border-color:#FF6B6B !important; box-shadow:0 0 0 3px rgba(255,107,107,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:700 }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>👤 My Profile</div>
          <div style={{ fontSize:13, color:"rgba(46,26,26,0.45)" }}>View and update your account</div>
        </div>

        <div className="fade-up" style={{ background:"#fff", borderRadius:20, overflow:"hidden", border:"1px solid rgba(255,107,107,0.1)", marginBottom:20 }}>

          {/* Banner */}
          <div style={{ background:"linear-gradient(135deg,#FF6B6B,#ee5a24)", padding:"32px 28px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", fontSize:100, opacity:0.08 }}>👨‍🎓</div>
            <div style={{ width:64, height:64, borderRadius:18, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:14, border:"2px solid rgba(255,255,255,0.3)" }}>
              👨‍🎓
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>
              {profile?.username}
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>{profile?.email}</div>
            <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:700 }}>STUDENT</span>
              {profile?.roll_number && profile.roll_number !== "—" && (
                <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:"rgba(255,255,255,0.15)", color:"#fff" }}>
                  Roll: {profile.roll_number}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:0, borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
            {[
              { label:"Enrolled Exams",  value:profile?.total_enrolled  ?? 0, color:"#6C63FF" },
              { label:"Exams Submitted", value:profile?.total_submitted ?? 0, color:"#00C9A7" },
            ].map((s,i) => (
              <div key={i} style={{ padding:"16px", textAlign:"center", borderRight: i===0 ? "1px solid rgba(26,26,46,0.06)" : "none" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ padding:28 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
              {[
                { icon:"🏛️", label:"Department",      value: DEPT_LABELS[profile?.department] || profile?.department },
                { icon:"📚", label:"Semester",         value: profile?.semester ? `Semester ${profile.semester}` : "—" },
                { icon:"🎫", label:"Roll Number",      value: profile?.roll_number || "—" },
                { icon:"📧", label:"Email",            value: profile?.email },
              ].map((item,i) => (
                <div key={i} style={{ padding:"14px 16px", background:"rgba(255,107,107,0.03)", borderRadius:12, border:"1px solid rgba(255,107,107,0.08)" }}>
                  <div style={{ fontSize:11, color:"rgba(46,26,26,0.45)", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                    <span>{item.icon}</span>{item.label}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {!editing ? (
              <button className="act-btn" onClick={() => setEditing(true)}
                style={{ padding:"11px 24px", borderRadius:10, border:"none", background:"#FF6B6B", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(255,107,107,0.3)" }}>
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ background:"rgba(255,107,107,0.03)", border:"1px solid rgba(255,107,107,0.1)", borderRadius:14, padding:20 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>✏️ Update Profile</div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[
                    { label:"Email", key:"email", type:"email", placeholder:"your@email.com" },
                    { label:"New Password (leave blank to keep)", key:"password", type:"password", placeholder:"New password" },
                    { label:"Confirm Password", key:"confirm_password", type:"password", placeholder:"Confirm password" },
                  ].map(field => (
                    <div key={field.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <label style={{ fontSize:12, fontWeight:700, color:"rgba(46,26,26,0.6)" }}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                        onChange={e => setForm({...form, [field.key]: e.target.value})}
                        style={{ padding:"10px 14px", border:"1px solid rgba(46,26,26,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:12, marginTop:16 }}>
                  <button onClick={() => setEditing(false)}
                    style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(46,26,26,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                  <button className="act-btn" onClick={handleSave} disabled={saving}
                    style={{ padding:"10px 24px", borderRadius:8, background:"#FF6B6B", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", opacity:saving?0.7:1 }}>
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:"12px 16px", background:"rgba(255,209,102,0.08)", border:"1px solid rgba(255,209,102,0.2)", borderRadius:12, fontSize:13, color:"rgba(46,26,26,0.6)", display:"flex", alignItems:"center", gap:8 }}>
          <span>ℹ️</span>
          <span>Department, semester and roll number can only be changed by Admin.</span>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;