import styled from 'styled-components';

interface Props {
  percentComplete: number;
  totalTime : number;
  className?: string;
}

const ProgressBarElement : React.FC<Props> = ({ percentComplete, totalTime, className }) => {

    const color = percentComplete > 66 ? "character" : percentComplete > 33 ? "artist" : "species";

  return <div className={className}>
      <div style={{width: `${percentComplete >= 0 ? percentComplete : 0}%`}} className={`inner-bar ${color}`}></div>
    </div>
};

export const ProgressBar = styled(ProgressBarElement)<Props>`

padding: 5px;
background-color: white;
border-radius: 10px;
height: ${p => p.theme.inputHeight};

.inner-bar {
    height: 100%;
    border-radius: 8px;

    transition: ${props => props.totalTime / 6}s ease background-color;

    &.character {
        background-color: ${p => p.theme.cTagCharacter};
    }

    &.artist {
        background-color: ${p => p.theme.cTagArtist};
    }

    &.species {
        background-color: ${p => p.theme.cTagSpecies};
    }
}
`