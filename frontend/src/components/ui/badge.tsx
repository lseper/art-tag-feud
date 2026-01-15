import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/ui/badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const variantClassMap = {
  default: styles.variantDefault,
  secondary: styles.variantSecondary,
  outline: styles.variantOutline,
  destructive: styles.variantDestructive,
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn(styles.badge, variantClassMap[variant], className)} {...props} />;
}

export { Badge };
