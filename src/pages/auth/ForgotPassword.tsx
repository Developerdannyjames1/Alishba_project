import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authApi } from "../../api/authApi";

export function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setError("");
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Request failed");
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check Your Email</h1>
          <p>
            If an account exists with that email, you will receive a password
            reset link shortly.
          </p>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
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
          <button type="submit">Send Reset Link</button>
        </form>
        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
