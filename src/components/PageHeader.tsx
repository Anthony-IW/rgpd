import { ReactNode } from "react";

export function PageHeader({
  title, description, actions, icon: Icon,
}: {
  title: string; description?: string; actions?: ReactNode; icon?: any;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="rounded-xl bg-gradient-primary p-2.5 shadow-glow shrink-0">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl break-words">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground break-words">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}