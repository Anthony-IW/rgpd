import { ReactNode } from "react";

export function PageHeader({
  title, description, actions, icon: Icon,
}: {
  title: string; description?: string; actions?: ReactNode; icon?: any;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-gradient-primary p-2.5 shadow-glow">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}