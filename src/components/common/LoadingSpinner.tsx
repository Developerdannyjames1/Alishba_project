interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ message = "Loading...", size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__dots">
        <div className="loading-spinner__dot" />
        <div className="loading-spinner__dot" />
        <div className="loading-spinner__dot" />
      </div>
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
}
