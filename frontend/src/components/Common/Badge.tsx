interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  // Inline styles are fine for this simple component
  const variantStyles = {
    default: { backgroundColor: '#e5e7eb', color: '#374151' },
    success: { backgroundColor: '#d1fae5', color: '#065f46' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    info: { backgroundColor: '#dbeafe', color: '#1e40af' },
  };

  const sizeStyles = {
    sm: { padding: '2px 6px', fontSize: '10px' },
    md: { padding: '4px 8px', fontSize: '12px' },
    lg: { padding: '6px 12px', fontSize: '14px' },
  };

  return (
    <span
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: '9999px',
        fontWeight: 500,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}
