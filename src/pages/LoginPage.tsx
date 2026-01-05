import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_EMAIL = "admin@gmail.com";
const MOCK_PASSWORD = "admin";

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

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const isValid =
      credentials.email.trim().toLowerCase() === MOCK_EMAIL &&
      credentials.password === MOCK_PASSWORD;

    if (isValid) {
      setError(null);
      onSuccess();
      navigate("/", { replace: true });
    } else {
      setError("Incorrect email or password.");
    }

    setSubmitting(false);
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-eyebrow">derbrid secure</p>
        <h1>Sign in to your workspace</h1>
        <p className="login-subhead">
          Use the mock credentials to continue into the downloader.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={MOCK_EMAIL}
              value={credentials.email}
              onChange={handleFieldChange}
              required
            />
          </label>
          <label className="input-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={MOCK_PASSWORD}
              value={credentials.password}
              onChange={handleFieldChange}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button
            type="submit"
            className="primary-button login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Continue"}
          </button>
          <button
            type="button"
            className="ghost-button login-secondary"
            onClick={() => navigate("/hosts")}
          >
            Check host list
          </button>
          <p className="login-hint">
            Mock account: {MOCK_EMAIL} · {MOCK_PASSWORD}
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
