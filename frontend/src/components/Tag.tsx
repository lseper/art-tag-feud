import type { PostTagType, TagTypeType, UserType } from '../types';
import { Badge } from '@/components/ui/badge';
import styles from '@/styles/components/tag.module.css';
import { buildUIIconImg } from '../util/UIUtil';

interface Props {
   tag?: PostTagType,
   showAutoBadge?: boolean,
   guessedBy?: UserType,
}

const TAG_CLASS_BY_TYPE: Record<TagTypeType, string> = {
  artist: styles.tagArtist,
  character: styles.tagCharacter,
  species: styles.tagSpecies,
  general: styles.tagGeneral,
};

const Tag : React.FC<Props> = ({tag, showAutoBadge, guessedBy } : Props) => {
  if (!tag) {
    return <li className={`${styles.tag} ${styles.hidden}`}>???</li>;
  }
  return (
    <li className={`${styles.tag} ${TAG_CLASS_BY_TYPE[tag.type] ?? styles.tagGeneral}`}>
      <p className={styles.tagText}>
        {tag.name}
        {guessedBy && (
          <Badge variant="outline" className={styles.guesserBadge}>
            {guessedBy.icon && buildUIIconImg(true, 'profile_icons/', guessedBy.icon, styles.guesserBadgeIcon)}
            <span className={styles.guesserBadgeName}>{guessedBy.username}</span>
          </Badge>
        )}
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