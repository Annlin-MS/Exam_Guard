import React, { useState } from "react";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState(localStorage.getItem("role"));

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Welcome {user}</h2>
      <p>Dashboard will appear here.</p>
    </div>
  );
}

export default App;
