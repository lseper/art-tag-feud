import type { GuessedTagEntryType, PostTagType } from '../types';
import Tag from './Tag';

interface Props {
    tags: PostTagType[],
    guessedTags: GuessedTagEntryType[],
    autoRevealedTagNames?: Set<string>
}

const TagList : React.FC<Props> = ({tags, guessedTags, autoRevealedTagNames} : Props) => {
    
    const guessedTagMap = new Map(guessedTags.map(entry => [entry.tag.name, entry]));
    return (
        <>
            <ul>
                {
                    tags.map((tag, i) => {
                        const guessedEntry = guessedTagMap.get(tag.name);
                        if(guessedEntry) {
                            // TODO: lazy tag reveal delay time - should be better
                            return (
                                <Tag
                                    tag={tag}
                                    guessedBy={guessedEntry.user}
                                    showAutoBadge={autoRevealedTagNames?.has(tag.name)}
                                />
                            );
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