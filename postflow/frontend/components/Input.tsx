"use client";

import { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={styles.container}>
        {label && <label className="typography-label-sm">{label}</label>}
        <input 
          ref={ref}
          className={`${styles.input} typography-body-md ${error ? styles.inputError : ''} ${className}`}
          {...props}
        />
        {error && <span className={`${styles.errorText} typography-label-sm`}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
