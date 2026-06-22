import styled from 'styled-components';

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

    color: ${p => p.theme.cTagCharacter}
`