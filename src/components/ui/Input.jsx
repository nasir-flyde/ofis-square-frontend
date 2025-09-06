import React from "react";
import clsx from "clsx";

export function Input({
  label,
  error,
  className = "",
  required = false,
  ...props
}) {
  const inputClasses = clsx(
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500",
    error && "border-red-300 focus:border-red-500 focus:ring-red-500",
    className
  );

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  required = false,
  rows = 4,
  ...props
}) {
  const textareaClasses = clsx(
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-vertical",
    error && "border-red-300 focus:border-red-500 focus:ring-red-500",
    className
  );

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea className={textareaClasses} rows={rows} {...props} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  className = "",
  required = false,
  children,
  ...props
}) {
  const selectClasses = clsx(
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500",
    error && "border-red-300 focus:border-red-500 focus:ring-red-500",
    className
  );

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select className={selectClasses} {...props}>
        {children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
