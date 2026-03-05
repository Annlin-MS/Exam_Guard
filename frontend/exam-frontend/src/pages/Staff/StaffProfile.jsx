import React, { useState } from "react";
import api from "../../services/api";

const StaffProfile = () => {
  const username = localStorage.getItem("username") || "Staff";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all fields!", "error"); return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match!", "error"); return;
    }
    if (newPassword.length < 6) {
      showToast("Minimum 6 characters!", "error"); return;
    }
    setLoading(true);
    try {
      await api.post("/api/admin/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast("Password changed! ✅");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        input:focus { outline: none; border-color: #00C9A7 !important; box-shadow: 0 0 0 3px rgba(0,201,167,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:800 }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>👤 My Profile</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Manage your account</div>
        </div>

        {/* Profile Card */}
        <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:28, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(135deg, #00C9A7, #00a187)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, flexShrink:0, boxShadow:"0 8px 24px rgba(0,201,167,0.3)" }}>
              👨‍🏫
            </div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:6 }}>{username}</div>
              <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"rgba(0,201,167,0.1)", color:"#00C9A7", border:"1px solid rgba(0,201,167,0.2)", letterSpacing:"0.06em" }}>
                ● STAFF
              </span>
            </div>
          </div>

          <div style={{ height:1, background:"rgba(0,201,167,0.08)", margin:"24px 0" }} />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            {[
              { label:"Role", value:"Teaching Staff", icon:"👨‍🏫" },
              { label:"Portal", value:"Staff Portal", icon:"🖥️" },
              { label:"Status", value:"Active", icon:"🟢" },
            ].map((item, i) => (
              <div key={i} style={{ padding:"14px 16px", background:"rgba(0,201,167,0.03)", border:"1px solid rgba(0,201,167,0.08)", borderRadius:10 }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontSize:11, color:"rgba(26,46,42,0.4)", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:14, fontWeight:600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:28, animationDelay:"0.1s" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>🔐 Change Password</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)", marginBottom:24 }}>Update your account password</div>

          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:400 }}>
            {[
              ["Current Password", currentPassword, setCurrentPassword],
              ["New Password", newPassword, setNewPassword],
              ["Confirm New Password", confirmPassword, setConfirmPassword],
            ].map(([label, value, setter], i) => (
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.5)", letterSpacing:"0.05em" }}>{label}</label>
                <input type="password" placeholder="••••••••" value={value} onChange={e => setter(e.target.value)}
                  style={{ padding:"11px 14px", border:"1px solid rgba(26,46,42,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }} />
              </div>
            ))}
            <button className="act-btn" onClick={handleChangePassword} disabled={loading}
              style={{ padding:"12px 24px", background:"#00C9A7", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)", opacity: loading ? 0.7 : 1, marginTop:4 }}>
              {loading ? "Updating..." : "🔐 Update Password"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffProfile;