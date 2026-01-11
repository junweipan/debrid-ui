import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type VerifyEmailPageProps = {
  onVerified: () => void;
};

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage({ onVerified }: VerifyEmailPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  const tokenFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token")?.trim() ?? "";
  }, [location.search]);

  useEffect(() => {
    if (!tokenFromQuery) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }

    const controller = new AbortController();
    let redirectTimeout: number | undefined;

    const verify = async () => {
      try {
        setState("loading");
        setMessage("Verifying your email...");

        const response = await fetch("http://localhost:4000/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromQuery }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const payload = await response.json();

        if (payload?.success && payload?.value?.token) {
          localStorage.setItem("authToken", payload.value.token);
          setState("success");
          setMessage("Verification successful. Redirecting you now...");
          onVerified();

          redirectTimeout = window.setTimeout(() => {
            navigate("/", { replace: true });
          }, 900);
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState("error");
        setMessage("Verification failed. Please request a new link.");
      }
    };

    verify();

    return () => {
      controller.abort();
      if (redirectTimeout) {
        window.clearTimeout(redirectTimeout);
      }
    };
  }, [tokenFromQuery]);

  return (
    <div className="verify-page-shell">
      <div className="verify-card">
        <h1>Email verification</h1>
        <p className={`verify-status verify-status-${state}`}>{message}</p>
        {state === "error" && (
          <button
            className="primary-button"
            onClick={() => navigate("/login", { replace: true })}
          >
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
