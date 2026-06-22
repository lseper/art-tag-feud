import type { PostTagType } from '../types';
import { VisibleTagName } from './VisibleTagName';
import { VisibleTagScore } from './VisibleTagScore';
import styles from '@/styles/components/visible-tag.module.css';

interface VisibleProps {
    tag: PostTagType;
    className?: string;
}

const TagElement : React.FC<VisibleProps> = (props) => {
    const { tag } = props;
    return (
        <div className={styles.visibleTag}>
            <VisibleTagName name={tag.name} tagType={tag.type}></VisibleTagName>
            <VisibleTagScore score={tag.score}/>
        </div>
    )
}

export const VisibleTag = TagElement;

interface HiddenProps {
    className?: string
}

const HiddenTagElement : React.FC<HiddenProps> = () => {
    return (
        <li className={styles.hiddenTag}>???</li>
    )
}

export const HiddenTag = HiddenTagElement;