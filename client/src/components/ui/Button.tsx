interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #0066FF 0%, #1E40AF 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(0,102,255,0.4), 0 2px 8px rgba(0,0,0,0.3)',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.8)',
      border: '1px solid rgba(35,45,63,0.9)',
      boxShadow: 'none',
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      color: '#EF4444',
      border: '1px solid rgba(239,68,68,0.3)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'rgba(255,255,255,0.6)',
      border: '1px solid transparent',
      boxShadow: 'none',
    },
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      style={variantStyles[variant]}
      onMouseEnter={e => {
        if (variant === 'primary') {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,102,255,0.5), 0 4px 16px rgba(0,0,0,0.4)';
          (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)';
        } else {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLElement).style.color = 'white';
        }
      }}
      onMouseLeave={e => {
        const styles = variantStyles[variant];
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = styles.boxShadow as string ?? '';
        (e.currentTarget as HTMLElement).style.filter = '';
        (e.currentTarget as HTMLElement).style.background = styles.background as string ?? '';
        (e.currentTarget as HTMLElement).style.color = styles.color as string ?? '';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
