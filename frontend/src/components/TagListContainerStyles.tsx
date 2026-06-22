import type * as React from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/components/tag-list-container.module.css';

export const TagListLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn(styles.tagListLabel, className)} {...props} />
);

export const TagsInputContainer = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.tagsInputContainer, className)} {...props} />
);

export const TagsInput = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.tagsInput, className)} {...props} />
);

export const TagsGrid = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.tagsGrid, className)} {...props} />
);

export const TagsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.tagsList, className)} {...props} />
);
