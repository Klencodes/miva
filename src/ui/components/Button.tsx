import React from "react";

// Added 'outline' and 'transparent' variants
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "info"
  | "danger"
  | "ghost"
  | "link"
  | "outline"
  | "transparent";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
  icon?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  radius = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  children,
  icon,
  title,
  className = "",
  type = "button",
}) => {
  const getLoadingColor = (): string => {
    // For transparent, outline, ghost, and link variants, use the primary color for the spinner
    if (["ghost", "link", "outline", "transparent"].includes(variant)) {
      return "var(--primary-color)";
    }
    return "currentColor"; // Use white for filled buttons
  };

  const getCustomRadius = (): string => {
    const radiusMap: Record<ButtonRadius, string> = {
      none: "0",
      sm: "var(--radius-sm, 0.375rem)",
      md: "var(--radius-md, 0.5rem)",
      lg: "var(--radius-lg, 0.75rem)",
      xl: "var(--radius-xl, 1rem)",
      full: "50%",
    };
    return radiusMap[radius];
  };

  const getButtonClasses = (): string => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium focus:outline-none disabled:opacity-70 disabled:pointer-events-none transition-colors duration-200";

    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    }[size];

    const variantClasses = {
      primary:
        "bg-primary text-white hover:bg-primary-80 border border-primary",
      secondary:
        "bg-secondary text-white hover:bg-secondary-80 border border-secondary",
      info:
        "bg-info text-white hover:bg-info-80 border border-info",
      danger:
        "bg-danger text-white hover:bg-danger-80 border border-danger",
      ghost:
        "bg-transparent text-text-light hover:bg-primary-10 hover:text-primary border border-border",
      link:
        "text-primary hover:text-primary-80 underline bg-transparent border-none",
      outline:
        "bg-transparent text-primary border border-primary hover:bg-primary-10 hover:text-primary-80",
      transparent:
        "bg-transparent text-text border-none hover:text-primary hover:bg-primary-10",
    }[variant];

    const widthClass = fullWidth ? "w-full" : "";

    return [baseClasses, sizeClasses, variantClasses, widthClass, className]
      .join(" ")
      .trim();
  };

  const hostClass = fullWidth ? "w-full" : "inline-block";

  return (
    <div className={hostClass}>
      <button
        type={type}
        disabled={disabled || loading}
        className={getButtonClasses()}
        onClick={onClick}
        style={{ borderRadius: getCustomRadius() }}
      >
        {loading && (
          <i
            className="ri-loader-4-line animate-spin -ml-1 mr-2 h-4 w-4"
            style={{ color: getLoadingColor() }}
          ></i>
        )}
        {!loading && icon && (<i className={`${icon} mr-1.5 text-sm`}></i>  )}
        {!loading && title && title}
        {children}
      </button>
    </div>
  );
};

export default Button;