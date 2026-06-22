import * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/ui/progress.module.css';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, indicatorStyle, ...props }, ref) => (
    <div ref={ref} className={cn(styles.progress, className)} {...props}>
      <div
        className={cn(styles.indicator, indicatorClassName)}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          ...indicatorStyle,
        }}
      />
    </div>
  ),
);
Progress.displayName = 'Progress';

export { Progress };
