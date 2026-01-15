import type { PostTagType } from '../types';
import Tag from './Tag';

interface Props {
    tags: PostTagType[],
    guessedTags: PostTagType[],
    autoRevealedTagNames?: Set<string>
}

const TagList : React.FC<Props> = ({tags, guessedTags, autoRevealedTagNames} : Props) => {
    
    return (
        <>
            <ul>
                {
                    tags.map((tag, i) => {
                        if(guessedTags.includes(tag)) {
                            // TODO: lazy tag reveal delay time - should be better
                            return <Tag tag={tag} showAutoBadge={autoRevealedTagNames?.has(tag.name)} />
                        } else {
                            return <Tag />
                        }
                    })
                }
            </ul>
        </>
    )
}

export default TagList;