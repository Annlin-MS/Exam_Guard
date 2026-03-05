import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminUserManagement = ({defaultTab = "staff"}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const [form, setForm] = useState({
    username: "", email: "", password: "", role: "STAFF"
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [staffRes, studentsRes] = await Promise.all([
        api.get("/api/admin/staff/"),
        api.get("/api/admin/students/"),
      ]);
      setStaff(staffRes.data);
      setStudents(studentsRes.data);
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

  const handleAdd = async () => {
    if (!form.username || !form.email || !form.password) {
      showToast("Please fill all fields!", "error");
      return;
    }
    try {
      const res = await api.post("/api/admin/create-user/", form);
      setCreatedUser(res.data);
      setShowAdd(false);
      setForm({ username: "", email: "", password: "", role: "STAFF" });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add user", "error");
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.post(`/api/admin/toggle-user/${userId}/`);
      showToast(isActive ? "User blocked! 🚫" : "User unblocked! ✅");
      fetchAll();
    } catch (err) {
      showToast("Failed to update user", "error");
    }
  };

  const currentList = activeTab === "staff" ? staff : students;
  const filtered = currentList.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(26,26,46,0.5)", fontFamily: "'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .row-item { animation: fadeUp 0.3s ease both; transition: all 0.15s; }
        .row-item:hover { background: rgba(108,99,255,0.03) !important; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        input:focus { outline: none; border-color: #6C63FF !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.1); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1100 }}>

        {/* Page Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>
              👥 User Management
            </div>
            <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>
              {staff.length} staff · {students.length} students
            </div>
          </div>
          <button className="act-btn" onClick={() => { setShowAdd(true); setForm({...form, role: activeTab === "staff" ? "STAFF" : "STUDENT"}); }}
            style={{ padding:"12px 24px", background:"#6C63FF", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(108,99,255,0.3)" }}>
            ➕ Add {activeTab === "staff" ? "Staff" : "Student"}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { label:"Total Staff", value: staff.length, icon:"👨‍🏫", color:"#6C63FF" },
            { label:"Active Staff", value: staff.filter(s=>s.is_active).length, icon:"🟢", color:"#00C9A7" },
            { label:"Total Students", value: students.length, icon:"👨‍🎓", color:"#FFD166" },
            { label:"Active Students", value: students.filter(s=>s.is_active).length, icon:"✅", color:"#FF6B6B" },
          ].map((c,i) => (
            <div key={i} style={{ background:"#fff", border:`1px solid ${c.color}22`, borderRadius:14, padding:"18px 20px", animation:`fadeUp 0.3s ease ${i*0.07}s both` }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:c.color }}>{c.value}</div>
              <div style={{ fontSize:12, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
            <div style={{ display:"flex", gap:4, background:"rgba(26,26,46,0.05)", borderRadius:10, padding:4 }}>
              {[["staff","👨‍🏫 Staff"], ["students","👨‍🎓 Students"]].map(([key,label]) => (
                <button key={key} className="act-btn" onClick={() => { setActiveTab(key); setSearch(""); }}
                  style={{ padding:"8px 20px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background: activeTab===key ? "#6C63FF" : "transparent", color: activeTab===key ? "#fff" : "rgba(26,26,46,0.5)", transition:"all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>
            <input
              placeholder="🔍 Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding:"9px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", width:260, transition:"all 0.15s" }}
            />
          </div>

          {/* Table Header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr", gap:16, padding:"12px 20px", background:"rgba(26,26,46,0.02)", borderBottom:"1px solid rgba(26,26,46,0.05)" }}>
            {["Username","Email","Status","Actions"].map(h => (
              <div key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>

          {/* Table Rows */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(26,26,46,0.4)" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:15, fontWeight:600 }}>No {activeTab} found</div>
            </div>
          ) : (
            filtered.map((user, i) => (
              <div key={user.id} className="row-item" style={{ display:"grid", gridTemplateColumns:"2fr 2fr 1fr 1fr", gap:16, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)", alignItems:"center", animationDelay:`${i*0.04}s` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: activeTab==="staff" ? "rgba(108,99,255,0.1)" : "rgba(255,107,107,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                    {activeTab === "staff" ? "👨‍🏫" : "👨‍🎓"}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e" }}>{user.username}</div>
                    <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)" }}>ID: {user.id}</div>
                  </div>
                </div>
                <div style={{ fontSize:13, color:"rgba(26,26,46,0.6)" }}>{user.email || "—"}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, letterSpacing:"0.05em", background: user.is_active ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", color: user.is_active ? "#00C9A7" : "#FF6B6B", border: `1px solid ${user.is_active ? "rgba(0,201,167,0.25)" : "rgba(255,107,107,0.25)"}` }}>
                    {user.is_active ? "● Active" : "● Blocked"}
                  </span>
                </div>
                <div>
                  <button className="act-btn" onClick={() => handleToggleActive(user.id, user.is_active)}
                    style={{ padding:"7px 14px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", background: user.is_active ? "rgba(255,107,107,0.1)" : "rgba(0,201,167,0.1)", color: user.is_active ? "#FF6B6B" : "#00C9A7" }}>
                    {user.is_active ? "🚫 Block" : "✅ Unblock"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }} onClick={() => setShowAdd(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:28, width:"90%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>➕ Add {form.role === "STAFF" ? "Staff" : "Student"}</div>
              <button onClick={() => setShowAdd(false)} style={{ background:"rgba(26,26,46,0.06)", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:4, background:"rgba(26,26,46,0.05)", borderRadius:10, padding:4, marginBottom:20 }}>
              {[["STAFF","👨‍🏫 Staff"],["STUDENT","👨‍🎓 Student"]].map(([role,label]) => (
                <button key={role} className="act-btn" onClick={() => setForm({...form, role})}
                  style={{ flex:1, padding:"8px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", background: form.role===role ? "#6C63FF" : "transparent", color: form.role===role ? "#fff" : "rgba(26,26,46,0.5)" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
              {[["Username *","text","username","e.g. john_staff"],["Email *","email","email","john@school.com"],["Password *","password","password","••••••••"]].map(([label,type,key,placeholder]) => (
                <div key={key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.6)", letterSpacing:"0.05em" }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    style={{ padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
              <button onClick={() => setShowAdd(false)} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={handleAdd} style={{ padding:"10px 24px", borderRadius:8, background:"#6C63FF", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)" }}>
                ➕ Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {createdUser && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001, backdropFilter:"blur(4px)" }}
          onClick={() => setCreatedUser(null)}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, width:"90%", maxWidth:420, textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:6 }}>
              Account Created!
            </div>
            <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginBottom:20 }}>
              Share these credentials with the {createdUser.role?.toLowerCase()}
            </div>
            <div style={{ background:"rgba(108,99,255,0.05)", border:"1px solid rgba(108,99,255,0.2)", borderRadius:12, padding:20, marginBottom:20, textAlign:"left" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  ["👤 Username", createdUser.username],
                  ["🔐 Password", createdUser.password],
                  ["🎭 Role",     createdUser.role],
                ].map(([label, value]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, color:"rgba(26,26,46,0.5)" }}>{label}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:"#6C63FF", fontFamily:"monospace" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize:12, color:"rgba(26,26,46,0.4)", marginBottom:20 }}>
              ⚠️ User can change password after first login
            </div>
            <button onClick={() => setCreatedUser(null)}
              style={{ padding:"12px 32px", background:"#6C63FF", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              ✅ Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUserManagement;