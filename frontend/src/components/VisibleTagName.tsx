import type { TagTypeType } from '../types';
import styled from 'styled-components';
import { media } from '../styles/theme/breakpoints';

interface Props {
    name: string;
    tagType: TagTypeType;
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
    color: var(--c-tag-${({ tagType }) => tagType});

    ${media.xl} {
        font-size: 0.95em;
    }

    ${media.lg} {
        font-size: 0.9em;
    }

    ${media.md} {
        font-size: 0.85em;
    }

    ${media.sm} {
        font-size: 0.8em;
    }

    ${media.xs} {
        font-size: 0.75em;
    }
`;