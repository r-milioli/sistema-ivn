import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="password-input-wrapper">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('password-input-field', className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {showPassword ? (
          <EyeOff className="password-input-icon" />
        ) : (
          <Eye className="password-input-icon" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
