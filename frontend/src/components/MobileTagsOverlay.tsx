import type { PostTagType } from '../types';
import { VisibleTag } from './VisibleTag';
import styles from '@/styles/components/mobile-tags-overlay.module.css';

interface Props {
  guessedTags: PostTagType[];
  totalTags: number;
  className?: string;
}

/**
 * Mobile overlay component that displays guessed tags and remaining count.
 * Positioned in the top-right corner with 50% opacity.
 */
const MobileTagsOverlay: React.FC<Props> = ({ guessedTags, totalTags, className }) => {
  const remainingCount = totalTags - guessedTags.length;

  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      <p className={styles.remainingCount}>
        {remainingCount} tag{remainingCount !== 1 ? 's' : ''} remaining
      </p>
      {guessedTags.length > 0 && (
        <ul className={styles.list}>
          {guessedTags.map((tag, index) => (
            <li className={styles.item} key={`${tag.name}-${index}`}>
              <VisibleTag tag={tag} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default MobileTagsOverlay;
