"use client";

import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} typography-label-md ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
