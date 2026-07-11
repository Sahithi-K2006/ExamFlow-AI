import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, hint, error, required, htmlFor, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', width: '100%' }}>
    {label && (
      <label htmlFor={htmlFor} style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--danger-9)' }}>*</span>}
      </label>
    )}
    {children}
    {error ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--danger-9)' }}>
        <AlertCircle size={12} /> {error}
      </span>
    ) : hint ? (
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{hint}</span>
    ) : null}
  </div>
);

const baseFieldStyle = (error?: boolean): React.CSSProperties => ({
  background: 'var(--surface-2)',
  border: `1px solid ${error ? 'var(--danger-9)' : 'var(--border-default)'}`,
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  width: '100%',
  transition: 'all var(--duration-fast) var(--ease-out)',
});

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, hint, error, required, id, style, ...rest }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <input id={fieldId} className="form-input" style={{ ...baseFieldStyle(!!error), ...style }} {...rest} />
    </FieldWrapper>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, hint, error, required, id, style, ...rest }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <textarea id={fieldId} style={{ ...baseFieldStyle(!!error), resize: 'vertical', minHeight: 90, lineHeight: 1.5, ...style }} {...rest} />
    </FieldWrapper>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, hint, error, required, id, style, children, ...rest }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <select id={fieldId} style={{ ...baseFieldStyle(!!error), cursor: 'pointer', ...style }} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
};
