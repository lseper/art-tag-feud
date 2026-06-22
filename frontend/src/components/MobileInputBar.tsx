import type { FormEvent, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import styles from '@/styles/components/mobile-input-bar.module.css';

interface Props {
  guess: string;
  setGuess: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  className?: string;
  nextRoundButton?: ReactNode;
  progressBar?: ReactNode;
}

/**
 * Mobile input bar fixed at the bottom of the screen for entering guesses.
 */
const MobileInputBar: React.FC<Props> = ({
  guess,
  setGuess,
  onSubmit,
  className,
  nextRoundButton,
  progressBar,
}) => {
  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      {nextRoundButton && <div className={styles.nextRoundOverlay}>{nextRoundButton}</div>}
      {progressBar && <div className={styles.progressBar}>{progressBar}</div>}
      <form className={styles.form} onSubmit={onSubmit}>
        <Input
          className={styles.input}
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Guess"
          autoComplete="off"
          autoCapitalize="off"
        />
      </form>
    </div>
  );
};
export default MobileInputBar;
