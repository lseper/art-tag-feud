import styles from '@/styles/components/progress-bar.module.css';
import { Progress } from '@/components/ui/progress';

interface Props {
  percentComplete: number;
  totalTime : number;
  className?: string;
  isMobile?: boolean;
}

const ProgressBarElement: React.FC<Props & { variant: 'desktop' | 'mobile' }> = ({
  percentComplete,
  totalTime,
  variant,
}) => {
  const colorClass = percentComplete > 66 ? 'character' : percentComplete > 33 ? 'artist' : 'species';
  const width = `${percentComplete >= 0 ? percentComplete : 0}%`;
  const transition = `${totalTime / 6}s ease background-color`;

  return (
    <Progress
      className={variant === 'mobile' ? styles.mobileProgressBar : styles.progressBar}
      indicatorClassName={`${variant === 'mobile' ? styles.mobileProgressBarInner : styles.progressBarInner} ${
        styles[colorClass]
      }`}
      indicatorStyle={{ transition }}
      value={percentComplete}
    />
  );
};

export const ProgressBar: React.FC<Props> = (props) => (
  <ProgressBarElement {...props} variant="desktop" />
);

/**
 * Mobile progress bar - compact version positioned above input overlay
 */
export const MobileProgressBar: React.FC<Props> = (props) => (
  <ProgressBarElement {...props} variant="mobile" />
);
