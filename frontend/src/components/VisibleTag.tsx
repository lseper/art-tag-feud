import type { PostTagType } from '../types';
import { VisibleTagName } from './VisibleTagName';
import styled from 'styled-components';
import { VisibleTagScore } from './VisibleTagScore';

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
`

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
`