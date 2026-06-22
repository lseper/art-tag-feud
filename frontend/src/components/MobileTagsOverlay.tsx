import type { GuessedTagEntryType } from '../types';
import Tag from './Tag';
import styles from '@/styles/components/mobile-tags-overlay.module.css';

interface Props {
  guessedTags: GuessedTagEntryType[];
  className?: string;
}

/**
 * Mobile overlay component that displays guessed tags.
 * Positioned in the top-left corner with 50% opacity.
 */
const MobileTagsOverlay: React.FC<Props> = ({ guessedTags, className }) => {
  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      {guessedTags.length > 0 && (
        <ul className={styles.list}>
          {guessedTags.map((entry, index) => (
            <Tag tag={entry.tag} guessedBy={entry.user} key={`${entry.tag.name}-${index}`} />
          ))}
        </ul>
      )}
    </div>
  );
};
export default MobileTagsOverlay;
