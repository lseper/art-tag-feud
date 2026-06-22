import type { GuessedTagEntryType } from '../types';
import Tag from './Tag';
import styles from '@/styles/components/mobile-landscape-tags.module.css';

interface Props {
  guessedTags: GuessedTagEntryType[];
  className?: string;
}

const buildColumns = (guessedTags: GuessedTagEntryType[]) => {
  const columns: GuessedTagEntryType[][] = [[], [], []];
  guessedTags.forEach((entry, index) => {
    if (index < 24) {
      const columnIndex = Math.floor(index / 8);
      columns[columnIndex].push(entry);
      return;
    }
    const columnIndex = (index - 24) % 3;
    columns[columnIndex].push(entry);
  });
  return columns;
};

const MobileLandscapeTags: React.FC<Props> = ({ guessedTags, className }) => {
  if (guessedTags.length === 0) {
    return null;
  }
  const columns = buildColumns(guessedTags);
  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      <div className={styles.columns}>
        {columns.map((column, columnIndex) => (
          <ul className={styles.column} key={`column-${columnIndex}`}>
            {column.map((entry, tagIndex) => (
              <Tag tag={entry.tag} guessedBy={entry.user} key={`${entry.tag.name}-${tagIndex}`} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export default MobileLandscapeTags;
