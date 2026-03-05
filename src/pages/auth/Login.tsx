import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { login } from "../../store/authSlice";
import type { LoginData } from "../../api/authApi";

export function Login() {
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setError("");
    const result = await dispatch(login(data));
    if (login.rejected.match(result)) {
      setError(result.payload as string);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="error-msg">{error}</div>}
          <div>
            <input
              type="email"
              placeholder="Email"
              {...registerField("email", { required: "Email is required" })}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              {...registerField("password", { required: "Password is required" })}
            />
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
}
