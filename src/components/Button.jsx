import React from "react";

const Button = ({ children, className = '', variant = 'primary', onClick, disabled, ...props }) => {
  const baseClass = 'btn';
  const variantClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  return (
    <button
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
