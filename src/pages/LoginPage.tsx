import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "../atoms/userAtoms";

const SAMPLE_EMAIL = "panjunweide@gmail.com";
const SAMPLE_PASSWORD = "123456";

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginPageProps = {
  onSuccess: () => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [, setUser] = useAtom(userAtom);
  const [, setToken] = useAtom(tokenAtom);
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
  const [isForgotPasswordModalOpen, setForgotPasswordModalOpen] =
    useState(false);
  const [isSendingTemporaryPassword, setSendingTemporaryPassword] =
    useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(
    null,
  );
  const forgotPasswordEmailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isForgotPasswordModalOpen) {
      forgotPasswordEmailInputRef.current?.focus();
    }
  }, [isForgotPasswordModalOpen]);

  const handleForgotPassword = () => {
    setForgotPasswordEmail(credentials.email.trim());
    setForgotPasswordError(null);
    setForgotPasswordModalOpen(true);
    setInfoMessage(null);
    setError(null);
  };

  const handleForgotPasswordCancel = () => {
    if (isSendingTemporaryPassword) {
      return;
    }
    setForgotPasswordError(null);
    setForgotPasswordModalOpen(false);
  };

  const handleForgotPasswordConfirm = async () => {
    if (isSendingTemporaryPassword) {
      return;
    }

    const normalizedEmail = forgotPasswordEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setForgotPasswordError("请输入注册邮箱。");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setForgotPasswordError("邮箱格式不正确，请重新输入。");
      return;
    }

    setSendingTemporaryPassword(true);
    setForgotPasswordError(null);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("REQUEST_FAILED");
      }

      const payload = await response.json();

      if (!payload?.success) {
        throw new Error("Invalid response");
      }

      setForgotPasswordModalOpen(false);
      setInfoVariant("success");
      setInfoMessage("临时密码已发送到您的注册邮箱，请注意查收邮件。");
    } catch (error) {
      setInfoVariant("warning");
      if (error instanceof Error && error.message === "NOT_FOUND") {
        setInfoMessage("该邮箱未注册，请检查后重试。");
      } else {
        setInfoMessage("临时密码发送失败，请稍后重试。");
      }
    } finally {
      setSendingTemporaryPassword(false);
    }
  };

  const handleForgotPasswordModalSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    handleForgotPasswordConfirm();
  };

  const handleRegister = () => {
    navigate("/register");
  };

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

    try {
      const normalizedEmail = credentials.email.trim();
      const normalizedEmailLower = normalizedEmail.toLowerCase();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: credentials.password,
          }),
        },
      );

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

      localStorage.setItem("authToken", token as string);
      setUser(user);
      setToken(token as string);
      setInfoMessage(null);
      onSuccess();
      navigate("/", { replace: true });
    } catch {
      setInfoMessage(null);
      setError("登录失败，请检查邮箱和密码后重试。");
    } finally {
      setSubmitting(false);
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
          <button
            type="submit"
            className="primary-button login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "正在登录…" : "登录"}
          </button>
          <button
            type="button"
            className="ghost-button login-verify-button"
            onClick={handleForgotPassword}
            disabled={isSubmitting}
          >
            忘记密码？
          </button>
          <button
            type="button"
            className="ghost-button login-verify-button"
            onClick={handleRegister}
            disabled={isSubmitting}
          >
            创建新账户
          </button>
          <p className="login-hint">
            示例账号: {SAMPLE_EMAIL} · {SAMPLE_PASSWORD}
          </p>
        </form>
      </div>

      {isForgotPasswordModalOpen && (
        <div
          className="login-modal-overlay"
          role="presentation"
          onClick={handleForgotPasswordCancel}
        >
          <form
            className="login-modal"
            onSubmit={handleForgotPasswordModalSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="forgot-password-title">确认发送临时密码？</h3>
            <p>
              请输入您的注册邮箱，系统会重置当前密码并将临时密码发送到该邮箱。
            </p>
            <label
              className="login-modal-input-field"
              htmlFor="forgot-password-email"
            >
              <span>注册邮箱</span>
              <input
                ref={forgotPasswordEmailInputRef}
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                value={forgotPasswordEmail}
                onChange={(event) => {
                  setForgotPasswordEmail(event.target.value);
                  if (forgotPasswordError) {
                    setForgotPasswordError(null);
                  }
                }}
                placeholder="请输入注册邮箱"
                disabled={isSendingTemporaryPassword}
              />
            </label>
            {forgotPasswordError && (
              <p className="login-modal-error">{forgotPasswordError}</p>
            )}
            <div className="login-modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleForgotPasswordCancel}
                disabled={isSendingTemporaryPassword}
              >
                取消
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={isSendingTemporaryPassword}
              >
                {isSendingTemporaryPassword ? "发送中..." : "确认发送"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
