import type { TagTypeType } from '../types';
import styles from '@/styles/components/visible-tag-name.module.css';

interface Props {
    name: string;
    tagType: TagTypeType;
    className?: string;
}

const tagClassMap: Record<TagTypeType, string> = {
  artist: styles.artist,
  character: styles.character,
  species: styles.species,
  general: styles.general,
};

const VisibleTagNameElement : React.FC<Props> = (props) => {
    const { name, tagType } = props;
    return (
        <p className={`${styles.name} ${tagClassMap[tagType] ?? styles.general}`.trim()}>{name}</p>
    )
}

export const VisibleTagName = VisibleTagNameElement;