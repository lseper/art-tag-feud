import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import styles from '@/styles/components/mobile-input-bar.module.css';

interface Props {
  guess: string;
  setGuess: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

/**
 * Mobile input bar fixed at the bottom of the screen for entering guesses.
 */
const MobileInputBar: React.FC<Props> = ({ guess, setGuess, onSubmit, className }) => {
  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      <form className={styles.form} onSubmit={onSubmit}>
        <Input
          className={styles.input}
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          autoComplete="off"
          autoCapitalize="off"
        />
      </form>
    </div>
  );
};
export default MobileInputBar;
