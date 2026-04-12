import React from "react";

export type ButtonVariant =
  | "primary" | "success" | "secondary" | "info" | "danger"
  | "ghost" | "link" | "outline" | "transparent";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";

export interface BadgeConfig {
  count: number;
  max?: number;
  variant?: 'danger' | 'primary' | 'success' | 'warning';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

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
  title?: string;
  icon?: string; // Remix Icon name (e.g., "add-line", "heart-fill")
  type?: "button" | "submit" | "reset";
  iconOnly?: boolean;
  pill?: boolean;
  badge?: BadgeConfig;
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
  className = "",
  title,
  type = "button",
  iconOnly = false,
  pill = false,
  badge,
}) => {
  const radiusMap: Record<ButtonRadius, string> = {
    none: "0px",
    sm:   "4px",
    md:   "8px",
    lg:   "12px",
    xl:   "16px",
    full: "9999px",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: iconOnly ? "h-8 w-8 p-0" : "h-8  px-3   text-xs   gap-1.5",
    md: iconOnly ? "h-9 w-9 p-0" : "h-9  px-4   text-sm   gap-2",
    lg: iconOnly ? "h-11 w-11 p-0" : "h-11 px-5   text-base gap-2.5",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:     "bg-primary text-white border border-primary hover:bg-primary-80 hover:border-primary-80",
    success:     "bg-success text-white border border-success hover:bg-success-80 hover:border-success-80",
    secondary:   "bg-secondary text-primary border border-border hover:bg-muted",
    info:        "bg-info text-white border border-info hover:bg-info-80 hover:border-info-80",
    danger:      "bg-danger text-white border border-danger hover:bg-danger-80 hover:border-danger-80",
    ghost:       "bg-transparent text-secondary border border-border hover:bg-secondary hover:text-primary hover:border-border-strong",
    outline:     "bg-transparent text-primary border border-primary hover:bg-primary/8",
    link:        "bg-transparent text-primary border border-transparent underline underline-offset-2 hover:text-primary-80",
    transparent: "bg-transparent text-secondary border border-transparent hover:bg-secondary hover:text-primary",
  };

  // Only filled variants use white spinner; unfilled use accent color
  const spinnerClass = ["primary", "success", "info", "danger"].includes(variant)
    ? "border-white/30 border-t-white"
    : "border-primary border-t-primary";

  const baseClasses = [
    "inline-flex items-center justify-center font-medium",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
    "disabled:opacity-45 disabled:pointer-events-none",
    "transition-all duration-150 active:scale-[0.975]",
    "whitespace-nowrap relative",
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? "w-full" : "",
    iconOnly ? "rounded-full" : (pill ? "rounded-full" : ""),
    className,
  ].filter(Boolean).join(" ");

  // Calculate badge display
  const getBadgeDisplay = () => {
    if (!badge) return null;
    const displayCount = badge.max && badge.count > badge.max ? `${badge.max}+` : badge.count;
    const badgeVariantClasses = {
      danger: "bg-danger text-white",
      primary: "bg-primary text-white",
      success: "bg-success text-white",
      warning: "bg-yellow-500 text-white",
    };
    
    const positionClasses = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1',
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1',
    };

    return (
      <span
        className={`
          absolute inline-flex items-center justify-center
          min-w-[18px] h-[18px] px-1 text-[10px] font-bold
          rounded-full ${badgeVariantClasses[badge.variant || 'danger']}
          ${positionClasses[badge.position || 'top-right']}
        `}
        style={{ transform: 'scale(1)', zIndex: 1 }}
      >
        {displayCount}
      </span>
    );
  };

  // Render icon from Remix Icon name
  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = iconOnly ? "text-base" : "text-base";
    return <i className={`ri-${icon} ${iconClass}`} />;
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={baseClasses}
      style={{ borderRadius: pill ? '9999px' : radiusMap[radius] }}
      onClick={onClick}
      title={title}
    >
      {loading && (
        <span
          className={`inline-block shrink-0 rounded-full border-[2px] animate-spin ${spinnerClass}`}
          style={{ width: size === "lg" ? 18 : 14, height: size === "lg" ? 18 : 14 }}
        />
      )}
      {!loading && icon && (
        <span className="shrink-0 flex items-center justify-center">
          {renderIcon()}
        </span>
      )}
      {children}
      {badge && !disabled && getBadgeDisplay()}
    </button>
  );
};

export default Button;