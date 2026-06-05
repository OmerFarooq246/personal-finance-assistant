import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="display-title">{title}</h1>
        <p className="mt-1 text-base leading-6 text-on-surface-variant">{description}</p>
      </div>
      {action ? <div className="self-start sm:self-auto">{action}</div> : null}
    </header>
  );
}
