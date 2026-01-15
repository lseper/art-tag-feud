import styles from '@/styles/components/visible-tag-score.module.css';

interface Props {
    score: number;
    className?: string;
}

const VisibleTagScoreElement : React.FC<Props> = (props) => {
    const { score } = props;
    return (
        <span className={styles.score}>{score}</span>
    )
}

export const VisibleTagScore = VisibleTagScoreElement;