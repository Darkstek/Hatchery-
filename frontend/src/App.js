import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
 
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
 
  return isLoggedIn
    ? <DashboardPage onLogout={() => setIsLoggedIn(false)} />
    : <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}
 