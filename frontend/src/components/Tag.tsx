import type { PostTagType, TagTypeType } from '../types';
import { TagType } from '../types';
import styled from 'styled-components';

import Theme from '../styles/theme/Theme';

interface Props {
   tag?: PostTagType,
}

const TAG_COLORS = new Map<TagTypeType, string>([
    [TagType.Enum.artist, Theme.cTagArtist],
    [TagType.Enum.character, Theme.cTagCharacter],
    [TagType.Enum.species, Theme.cTagSpecies],
    [TagType.Enum.general, Theme.cPrimaryText],
])

const REVEAL_TRANSITION_TIME = 200;

const Tag : React.FC<Props> = ({tag } : Props) => {
    if (!tag) {
        return <TagElement className='hidden' color={Theme.cPrimaryText}>???</TagElement>
    } else {
        return (
        <TagElement color={TAG_COLORS.get(tag.type) ?? Theme.cPrimaryText}>
                <p>
                    {tag.name}
                </p>
                <span>
                    {tag.score}
                </span>
        </TagElement>)
        }
    }

type TagProps = {
    color: string,
}

const TagElement = styled.li<TagProps>`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-grow: 1;
    justify-content: space-between;
    align-content: flex-start;
    align-items: flex-start;

    padding: 2px;
    margin-bottom: 4px;
    opacity: 1;

    color: ${p => p.color};

    transition: border ${REVEAL_TRANSITION_TIME}ms, opacity ${REVEAL_TRANSITION_TIME}ms;
    transition-delay: 0ms;

    &.hidden {
        justify-content: center;
        letter-spacing: 20px;

        border: 2px dashed #B4C7D9;
        color: #B4C7D9;
        border-radius: 5px;

        text-align: center;
        font-style: italic;
        opacity: 1;
    }


    /* Tag Score */
    span {
        color: ${p => p.theme.cTagCharacter};
    }
`


export default Tag;