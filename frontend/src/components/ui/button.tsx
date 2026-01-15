import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/ui/button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantClassMap = {
  default: styles.variantDefault,
  secondary: styles.variantSecondary,
  outline: styles.variantOutline,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
};

const sizeClassMap = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(styles.button, variantClassMap[variant], sizeClassMap[size], className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button };
