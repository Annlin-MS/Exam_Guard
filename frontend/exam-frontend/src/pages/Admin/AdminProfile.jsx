import React from "react";

const AdminProfile = () => {
  const username = "Admin";
  const email = "admin@example.com";

  return (
    <div>
      <h2 style={{ color: "#6C63FF" }}>Admin Profile</h2>

      <div style={styles.card}>
        <p><strong>Name:</strong> {username}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Role:</strong> ADMIN</p>
      </div>
    </div>
  );
};

const styles = {
  card: {
    marginTop: "20px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
};

export default AdminProfile;