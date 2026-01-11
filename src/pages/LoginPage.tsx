import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const SAMPLE_EMAIL = "panjunweide@gmail.com";
const SAMPLE_PASSWORD = "secret123";

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginPageProps = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoVariant, setInfoVariant] = useState<
    "neutral" | "warning" | "success"
  >("neutral");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isRequestingVerification, setRequestingVerification] = useState(false);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfoMessage(null);
    setPendingVerification(false);

    try {
      const normalizedEmail = credentials.email.trim();
      const normalizedEmailLower = normalizedEmail.toLowerCase();
      const response = await fetch("http://localhost:4000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const payload = await response.json();
      const user = payload?.value?.user;
      const token = payload?.value?.token;

      if (!payload?.success || !user || !token) {
        throw new Error("Invalid response");
      }

      if ((user.email as string)?.toLowerCase() !== normalizedEmailLower) {
        throw new Error("Email mismatch");
      }

      if (!user.email_verified) {
        setInfoVariant("warning");
        setInfoMessage(
          "you haven't active your account, please click the button to send activate link to your email."
        );
        setPendingVerification(true);
        return;
      }

      localStorage.setItem("authToken", token as string);
      setInfoMessage(null);
      onSuccess();
      navigate("/", { replace: true });
    } catch {
      setInfoMessage(null);
      setPendingVerification(false);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestVerification = async () => {
    if (
      isRequestingVerification ||
      !credentials.email ||
      !credentials.password
    ) {
      return;
    }

    setRequestingVerification(true);
    setInfoVariant("neutral");
    setInfoMessage("Sending activation link...");

    try {
      const normalizedEmail = credentials.email.trim();
      const response = await fetch(
        "http://localhost:4000/users/register/request-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: credentials.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      await response.json();
      setInfoVariant("success");
      setInfoMessage("Activation email sent. Please check your inbox.");
    } catch {
      setInfoVariant("warning");
      setInfoMessage(
        "Failed to send activation email. Please try again later."
      );
    } finally {
      setRequestingVerification(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-eyebrow">derbrid secure</p>
        <p className="login-subhead">请先登录后使用全部功能</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>邮箱</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={SAMPLE_EMAIL}
              value={credentials.email}
              onChange={handleFieldChange}
              required
            />
          </label>
          <label className="input-field">
            <span>密码</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={SAMPLE_PASSWORD}
              value={credentials.password}
              onChange={handleFieldChange}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {infoMessage && (
            <p className={`login-info login-info-${infoVariant}`}>
              {infoMessage}
            </p>
          )}
          {pendingVerification && (
            <button
              type="button"
              className="ghost-button login-verify-button"
              onClick={handleRequestVerification}
              disabled={isRequestingVerification}
            >
              {isRequestingVerification ? "发送激活邮件中…" : "发送激活邮件"}
            </button>
          )}
          <button
            type="submit"
            className="primary-button login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "正在登录…" : "登录"}
          </button>
          <p className="login-hint">
            示例账号: {SAMPLE_EMAIL} · {SAMPLE_PASSWORD}
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
