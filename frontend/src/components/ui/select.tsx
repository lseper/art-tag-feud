import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/ui/select.module.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(styles.select, className)} {...props} />
));
Select.displayName = 'Select';

export { Select };
