import React from "react";
import { Link } from "react-router-dom";
import Button from "./Button";

export interface IBreadcrumbItem {
  label: string;
  url: string;
  isActive?: boolean;
}

export interface IBreadcrumbAction {
  label: string;
  action: () => void;
  icon?: string;
  size?: "sm" | "md" | "lg";
  variant?:
    | "primary"
    | "secondary"
    | "info"
    | "danger"
    | "ghost"
    | "link"
    | "outline"
    | "transparent";
  disabled?: boolean;
}

export interface BreadcrumbProps {
  breadcrumbs: IBreadcrumbItem[];
  pageTitle: string;
  pageSubtitle?: string;
  actions?: IBreadcrumbAction[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  breadcrumbs = [],
  pageTitle,
  pageSubtitle,
  actions = [],
}) => {
  return (
    <div className="my-3">
      <div className="flex justify-between items-start ">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-text">{pageTitle}</h2>
          {pageSubtitle && (
            <p className="text-sm text-text-light mt-1">{pageSubtitle}</p>
          )}
        </div>

        <div className="flex items-end flex-col flex-wrap">
          {actions && actions.length > 0 && (
            <div>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  className="ml-2"
                  onClick={action.action}
                  disabled={action.disabled ?? false}
                  variant={action.variant ?? "primary"}
                  size={action.size ?? "sm"}
                  icon={action.icon ? `ri-${action.icon}-line` : undefined} // ← pass to Button
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {breadcrumbs.length > 0 && (
            <nav className="py-2">
              <ol className="flex flex-wrap items-center text-sm">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <li key={index} className="flex items-center">
                      {!isLast && breadcrumb.url ? (
                        <Link
                          to={breadcrumb.url}
                          className="text-primary font-semibold hover:text-primary text-md transition-colors duration-200"
                        >
                          {breadcrumb.label}
                        </Link>
                      ) : (
                        <span
                          className={`text-md ${
                            isLast
                              ? "text-text font-semibold"
                              : "text-text-light"
                          }`}
                          aria-current={isLast ? "page" : undefined}
                        >
                          {breadcrumb.label}
                        </span>
                      )}

                      {!isLast && (
                        <span className="text-text-light mx-1">
                          <i className="ri-arrow-right-double-fill text-md"></i>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
