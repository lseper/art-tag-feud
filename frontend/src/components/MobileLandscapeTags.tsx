import type { PostTagType } from '../types';
import Tag from './Tag';
import styles from '@/styles/components/mobile-landscape-tags.module.css';

interface Props {
  guessedTags: PostTagType[];
  className?: string;
}

const buildColumns = (guessedTags: PostTagType[]) => {
  const columns: PostTagType[][] = [[], [], []];
  guessedTags.forEach((tag, index) => {
    if (index < 24) {
      const columnIndex = Math.floor(index / 8);
      columns[columnIndex].push(tag);
      return;
    }
    const columnIndex = (index - 24) % 3;
    columns[columnIndex].push(tag);
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
            {column.map((tag, tagIndex) => (
              <Tag tag={tag} key={`${tag.name}-${tagIndex}`} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

export default MobileLandscapeTags;
