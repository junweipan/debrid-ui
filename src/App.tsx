import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { DownloaderPage } from "./pages/DownloaderPage";
import { HostStatusPage } from "./pages/HostStatusPage";
import { LoginPage } from "./pages/LoginPage";
import { ToolsRecommendationPage } from "./pages/ToolsRecommendationPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthenticated(Boolean(localStorage.getItem("authToken")));
    };

    syncAuthState();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "authToken") {
        syncAuthState();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthenticated(false);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <DownloaderPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/hosts"
          element={
            isAuthenticated ? (
              <HostStatusPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tools"
          element={
            isAuthenticated ? (
              <ToolsRecommendationPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/verify-email"
          element={<VerifyEmailPage onVerified={handleLoginSuccess} />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
