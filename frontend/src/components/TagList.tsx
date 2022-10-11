import type { PostTagType } from '../types';
import Tag from './Tag';

interface Props {
    tags: PostTagType[],
    guessedTags: PostTagType[],
    revealAll: boolean,
    baseDelayIndex: number,
}
// reveal stagger in ms
const TAG_REVEAL_DELAY = 500;

const TagList : React.FC<Props> = ({tags, guessedTags, revealAll, baseDelayIndex} : Props) => {
    
    return (
        <>
            <ul>
                {
                    tags.map((tag, i) => {
                        if(guessedTags.includes(tag)) {
                            // TODO: lazy tag reveal delay time - should be better
                            return <Tag tag={tag} abnormalReveal={revealAll} delay={(i + baseDelayIndex) * TAG_REVEAL_DELAY}/>
                        } else {
                            return <Tag abnormalReveal={revealAll} delay={(i + baseDelayIndex) * TAG_REVEAL_DELAY}/>
                        }
                    })
                }
            </ul>
        </>
    )
}

export default TagList;