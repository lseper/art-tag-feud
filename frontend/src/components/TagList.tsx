import { VisibleTag, HiddenTag } from './VisibleTag';
import type { PostTagType } from '../types';

interface Props {
    tags: PostTagType[],
    guessedTags: PostTagType[]
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