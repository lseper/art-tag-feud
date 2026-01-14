import styled from 'styled-components';
import { media } from '../styles/theme/breakpoints';

interface Props {
  percentComplete: number;
  totalTime : number;
  className?: string;
  isMobile?: boolean;
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

    ${media.xl} {
        padding: 4px;
        height: 22px;
    }

    ${media.lg} {
        padding: 3px;
        height: 20px;
    }

    ${media.md} {
        height: 18px;
    }

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
`;

/**
 * Mobile progress bar - compact version positioned above input overlay
 */
export const MobileProgressBar = styled(ProgressBarElement)<Props>`
    position: fixed;
    bottom: 56px;
    left: 8px;
    right: 8px;
    height: 8px;
    padding: 2px;
    z-index: 16;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 4px;

    .inner-bar {
        height: 100%;
        border-radius: 3px;

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
`;
