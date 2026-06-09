import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";

interface RegisterResponse {
  success: boolean;
  value: {
    user: {
      _id: string;
      email: string;
      role: string;
    };
    token: string;
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !password) {
      setError("邮箱和密码为必填项");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为 6 位");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `注册失败：${response.statusText}`,
        );
      }

      const data: RegisterResponse = await response.json();

      if (data.success && data.value.token) {
        localStorage.setItem("authToken", data.value.token);
        localStorage.setItem("user", JSON.stringify(data.value.user));

        setSuccess(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>创建账户</h1>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">注册成功，正在跳转...</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少 6 位）"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <div className="login-link">
          已有账户？{" "}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            前往登录
          </a>
        </div>
      </div>
    </div>
  );
}
