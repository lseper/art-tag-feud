import type * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/components/styled-elements.module.css';

export const TitleContainer = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.titleContainer, className)} {...props} />
);

export const List = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn(styles.list, className)} {...props} />
);

export const Header = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn(styles.header, className)} {...props} />
);

export const TitleText = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className={cn(styles.titleText, className)} {...props} />
);

export const Container = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.container, className)} {...props} />
);