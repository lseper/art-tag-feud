import type { TagType } from '../types';
import styled from 'styled-components';

interface Props {
    name: string;
    tagType: TagType;
    className?: string;
}

const VisibleTagNameElement : React.FC<Props> = (props) => {
    const { name, className } = props;
    return (
        <p className={className}>{name}</p>
    )
}

export const VisibleTagName = styled(VisibleTagNameElement)<Props>`
    order: 0;
    flex: 0 1 auto;
    align-self: auto;

    /* Extracting tagType from this */
    color: var(--c-tag-${({ tagType }) => tagType})
`