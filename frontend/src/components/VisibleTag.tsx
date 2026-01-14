import type { PostTagType } from '../types';
import { VisibleTagName } from './VisibleTagName';
import styled from 'styled-components';
import { VisibleTagScore } from './VisibleTagScore';
import { media } from '../styles/theme/breakpoints';

interface VisibleProps {
    tag: PostTagType;
    className?: string;
}

const TagElement : React.FC<VisibleProps> = (props) => {
    const { tag, className } = props;
    return (
        <div className={className}>
            <VisibleTagName name={tag.name} tagType={tag.type}></VisibleTagName>
            <VisibleTagScore score={tag.score}/>
        </div>
    )
}

export const VisibleTag = styled(TagElement)`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-grow: 1;
    justify-content: space-between;
    align-content: flex-start;
    align-items: flex-start;

    padding: 2px;

    ${media.xl} {
        padding: 2px 1px;
        font-size: 0.95em;
    }

    ${media.lg} {
        font-size: 0.9em;
    }

    ${media.md} {
        padding: 1px;
        font-size: 0.85em;
    }

    ${media.sm} {
        font-size: 0.8em;
    }

    ${media.xs} {
        font-size: 0.75em;
    }
`;

interface HiddenProps {
    className?: string
}

const HiddenTagElement : React.FC<HiddenProps> = (props) => {
    const { className } = props;
    return (
        <li className={className}>???</li>
    )
}

export const HiddenTag = styled(HiddenTagElement)`
    display: block;

    margin: ${p => p.theme.mTag};
    letter-spacing: 20px;

    border: 2px dashed #B4C7D9;
    border-radius: 5px;

    text-align: center;
    font-style: italic;

    ${media.xl} {
        letter-spacing: 15px;
        margin: 6px;
    }

    ${media.lg} {
        letter-spacing: 12px;
    }

    ${media.md} {
        letter-spacing: 10px;
        margin: 5px;
        border-width: 1px;
    }

    ${media.sm} {
        letter-spacing: 8px;
        margin: 4px;
    }

    ${media.xs} {
        letter-spacing: 6px;
        margin: 3px;
        border-radius: 3px;
    }
`;