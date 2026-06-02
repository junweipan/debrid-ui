import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAtom } from "jotai";
import "./App.css";
import { DownloaderPage } from "./pages/DownloaderPage";
import { HostStatusPage } from "./pages/HostStatusPage";
import { LoginPage } from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ToolsRecommendationPage } from "./pages/ToolsRecommendationPage";
import { tokenAtom, userAtom } from "./atoms/userAtoms";

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isAuthReady, setAuthReady] = useState(false);
  const [, setUser] = useAtom(userAtom);
  const [, setToken] = useAtom(tokenAtom);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("authToken");

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setAuthenticated(false);
        setAuthReady(true);
        return;
      }

      // Trust existing token first so refresh keeps the user on protected pages.
      setAuthenticated(true);
      setAuthReady(true);
      setToken(storedToken);

      try {
        const response = await fetch("http://localhost:4000/users/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session restore failed");
        }

        const payload = await response.json();
        const user = payload?.value?.user;
        const refreshedToken = payload?.value?.token;

        if (!payload?.success || !user) {
          throw new Error("Invalid session response");
        }

        const nextToken =
          typeof refreshedToken === "string" && refreshedToken.length > 0
            ? refreshedToken
            : storedToken;

        localStorage.setItem("authToken", nextToken);
        setUser(user);
        setToken(nextToken);
      } catch {
        // Keep current session state on refresh errors and avoid forced redirect.
      }
    };

    void restoreSession();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "authToken") {
        void restoreSession();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [setToken, setUser]);

  const handleLoginSuccess = useCallback(() => {
    setAuthenticated(Boolean(localStorage.getItem("authToken")));
    setAuthReady(true);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthenticated(false);
    setAuthReady(true);
  }, [setToken, setUser]);

  if (!isAuthReady) {
    return <div className="login-shell">正在恢复会话...</div>;
  }

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
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
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
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
