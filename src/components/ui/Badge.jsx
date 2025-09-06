import React from "react";
import clsx from "clsx";

const badgeVariants = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
};

export function Badge({ children, variant = "gray", className = "" }) {
  const classes = clsx(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    badgeVariants[variant],
    className
  );

  return <span className={classes}>{children}</span>;
}
