import React from "react";
import clsx from "clsx";

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-blue-500",
  outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon,
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  const classes = clsx(
    baseClasses,
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <DotLoader />}
      {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function DotLoader() {
  return (
    <span className="dot-loader" aria-label="Loading">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}
