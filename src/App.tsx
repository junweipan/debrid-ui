import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { DownloaderPage } from "./pages/DownloaderPage";
import { HostStatusPage } from "./pages/HostStatusPage";
import { LoginPage } from "./pages/LoginPage";
import { ToolsRecommendationPage } from "./pages/ToolsRecommendationPage";

function App() {
  const [isAuthenticated, setAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onSuccess={() => setAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <DownloaderPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/hosts" element={<HostStatusPage />} />
        <Route path="/tools" element={<ToolsRecommendationPage />} />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
