import styled from 'styled-components';
import { media } from '../styles/theme/breakpoints';

interface Props {
    score: number;
    className?: string;
}

const VisibleTagScoreElement : React.FC<Props> = (props) => {
    const { score, className } = props;
    return (
        <span className={className}>{score}</span>
    )
}

export const VisibleTagScore = styled(VisibleTagScoreElement)<Props>`
    order: 0;
    flex: 0 1 auto;
    align-self: auto;

    color: ${p => p.theme.cTagCharacter};

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