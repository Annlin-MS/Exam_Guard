import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import api from "../../services/api";

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";

  const NAV_ITEMS = [
    { icon:"🏠", label:"Dashboard",   path:"/student/dashboard"   },
    { icon:"📋", label:"My Exams",    path:"/student/exams"       },
    { icon:"📊", label:"Results",     path:"/student/results"     },
    { icon:"📈", label:"Performance", path:"/student/performance" },
    { icon:"👤", label:"Profile",     path:"/student/profile"     },
  ];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleNotifAction = (notif) => {
    setShowNotif(false);
    if (notif.action === "VIEW_RESULT") navigate("/student/results");
  };

  const unreadCount = notifications.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background: #fff8f0; }
        .nav-link { text-decoration:none; transition: all 0.15s; }
        .nav-link:hover { background: rgba(255,107,107,0.06) !important; }
        .nav-link.active { background: rgba(255,107,107,0.1) !important; }
        .nav-link.active .nav-label { color: #FF6B6B !important; }
        .nav-link.active .nav-icon-wrap { background: rgba(255,107,107,0.12) !important; }
        .collapse-btn:hover { background: rgba(255,107,107,0.08) !important; }
        .notif-item:hover { background: rgba(0,0,0,0.03) !important; }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .notif-badge { animation: pulse 2s infinite; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:"'DM Sans',sans-serif" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: collapsed ? 72 : 240, background:"#fff", borderRight:"1px solid rgba(255,107,107,0.1)", display:"flex", flexDirection:"column", transition:"width 0.25s ease", flexShrink:0, overflow:"hidden" }}>

          {/* Logo */}
          <div style={{ padding: collapsed ? "20px 0" : "20px 20px", borderBottom:"1px solid rgba(255,107,107,0.08)", display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "space-between" }}>
            {!collapsed && (
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#FF6B6B" }}>ExamGuard</div>
                <div style={{ fontSize:10, color:"rgba(46,26,26,0.4)", letterSpacing:"0.08em" }}>STUDENT PORTAL</div>
              </div>
            )}
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}
              style={{ width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,107,107,0.06)", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {collapsed ? "→" : "←"}
            </button>
          </div>

          {/* Student Info */}
          {!collapsed && (
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,107,107,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#FF6B6B,#ee5a24)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👨‍🎓</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2e1a1a" }}>{username}</div>
                  <div style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(255,107,107,0.1)", color:"#FF6B6B", fontWeight:700, width:"fit-content" }}>STUDENT</div>
                </div>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav style={{ flex:1, padding:"12px 0", overflowY:"auto" }}>
            {NAV_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} className={({isActive}) => `nav-link${isActive ? " active" : ""}`}
                style={{ display:"flex", alignItems:"center", gap:12, padding: collapsed ? "12px 0" : "10px 16px", margin:"2px 8px", borderRadius:10, justifyContent: collapsed ? "center" : "flex-start" }}>
                <div className="nav-icon-wrap" style={{ width:34, height:34, borderRadius:9, background:"rgba(46,26,26,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                  {item.icon}
                </div>
                {!collapsed && <span className="nav-label" style={{ fontSize:13, fontWeight:600, color:"rgba(46,26,26,0.7)", whiteSpace:"nowrap" }}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,107,107,0.06)" }}>
            <button onClick={handleLogout}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding: collapsed ? "10px 0" : "10px 16px", borderRadius:10, border:"none", background:"rgba(255,107,107,0.06)", cursor:"pointer", justifyContent: collapsed ? "center" : "flex-start" }}>
              <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,107,107,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🚪</div>
              {!collapsed && <span style={{ fontSize:13, fontWeight:600, color:"#FF6B6B" }}>Logout</span>}
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Topbar */}
          <div style={{ height:60, background:"#fff", borderBottom:"1px solid rgba(255,107,107,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0 }}>
            <div style={{ fontSize:13, color:"rgba(46,26,26,0.5)", fontWeight:500 }}>
              {time.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
              {" · "}
              <span style={{ fontFamily:"monospace", color:"#FF6B6B", fontWeight:700 }}>
                {time.toLocaleTimeString()}
              </span>
            </div>

            {/* Notification Bell */}
            <div style={{ position:"relative" }} ref={notifRef}>
              <button onClick={() => setShowNotif(!showNotif)}
                style={{ position:"relative", width:40, height:40, borderRadius:10, border:"none", background: unreadCount > 0 ? "rgba(255,107,107,0.08)" : "rgba(46,26,26,0.04)", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>
                🔔
                {unreadCount > 0 && (
                  <div className="notif-badge" style={{ position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%", background:"#FF6B6B", color:"#fff", fontSize:10, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {showNotif && (
                <div style={{ position:"absolute", top:48, right:0, width:340, background:"#fff", borderRadius:16, boxShadow:"0 16px 48px rgba(0,0,0,0.15)", border:"1px solid rgba(46,26,26,0.08)", zIndex:1000, animation:"fadeDown 0.2s ease", overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(46,26,26,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>🔔 Notifications</div>
                    {unreadCount > 0 && (
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"rgba(255,107,107,0.1)", color:"#FF6B6B", fontWeight:700 }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div style={{ maxHeight:400, overflowY:"auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding:"40px 20px", textAlign:"center", color:"rgba(46,26,26,0.4)" }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>All caught up!</div>
                        <div style={{ fontSize:12, marginTop:4 }}>No new notifications</div>
                      </div>
                    ) : (
                      notifications.map((notif, i) => (
                        <div key={notif.id} className="notif-item"
                          onClick={() => handleNotifAction(notif)}
                          style={{ padding:"14px 20px", borderBottom:"1px solid rgba(46,26,26,0.04)", cursor:"pointer" }}>
                          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🎉</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:"#00C9A7", marginBottom:2 }}>{notif.title}</div>
                              <div style={{ fontSize:12, color:"rgba(46,26,26,0.55)", lineHeight:1.4 }}>{notif.message}</div>
                              <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:"#FF6B6B" }}>→ View Result</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div style={{ flex:1, overflowY:"auto", padding:28 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentLayout;
