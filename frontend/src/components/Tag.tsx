import type { PostTagType, TagTypeType } from '../types';
import { Badge } from '@/components/ui/badge';
import styles from '@/styles/components/tag.module.css';

interface Props {
   tag?: PostTagType,
   showAutoBadge?: boolean,
}

const TAG_CLASS_BY_TYPE: Record<TagTypeType, string> = {
  artist: styles.tagArtist,
  character: styles.tagCharacter,
  species: styles.tagSpecies,
  general: styles.tagGeneral,
};

const Tag : React.FC<Props> = ({tag, showAutoBadge } : Props) => {
  if (!tag) {
    return <li className={`${styles.tag} ${styles.hidden}`}>???</li>;
  }
  return (
    <li className={`${styles.tag} ${TAG_CLASS_BY_TYPE[tag.type] ?? styles.tagGeneral}`}>
      <p className={styles.tagText}>
        {tag.name}
        {showAutoBadge && (
          <Badge variant="outline" className={styles.autoBadge}>
            Auto
          </Badge>
        )}
      </p>
      <span className={styles.score}>{tag.score}</span>
    </li>
  );
}

export default Tag;