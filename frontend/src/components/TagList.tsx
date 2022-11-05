import type { PostTagType } from '../types';
import Tag from './Tag';

interface Props {
    tags: PostTagType[],
    guessedTags: PostTagType[]
}
// reveal stagger in ms
const TAG_REVEAL_DELAY = 500;

const TagList : React.FC<Props> = ({tags, guessedTags} : Props) => {
    
    return (
        <>
            <ul>
                {
                    tags.map((tag, i) => {
                        if(guessedTags.includes(tag)) {
                            // TODO: lazy tag reveal delay time - should be better
                            return <Tag tag={tag}/>
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