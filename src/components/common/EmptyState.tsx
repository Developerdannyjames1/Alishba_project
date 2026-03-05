import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = "📋" }: EmptyStateProps) {
  return (
    <div className="empty-state-card">
      <span className="empty-state-card__icon">{icon}</span>
      <h3>{title}</h3>
      {description && <p className="empty-state-card__desc">{description}</p>}
      {action && <div className="empty-state-card__action">{action}</div>}
    </div>
  );
}
