import { VisibleTag, HiddenTag } from './VisibleTag';
import type { Tag } from '../types';

interface Props {
    tags: Tag[],
    guessedTags: Tag[]
}

export const TagList : React.FC<Props> = (props : Props) => {
    const {tags, guessedTags} = props;

    return (
        <>
            <ul>
                {
                    tags.map((tag) => {
                        if(guessedTags.includes(tag)) {
                            // render VisibleTag
                            return <VisibleTag tag={tag}></VisibleTag>
                        } else {
                            // render HiddenTag
                            return <HiddenTag></HiddenTag>
                        }
                    })
                }
            </ul>
        </>
    )
}