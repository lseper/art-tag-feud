import styled from 'styled-components';
import type { PostTagType } from '../types';
import { VisibleTag } from './VisibleTag';

interface Props {
  guessedTags: PostTagType[];
  totalTags: number;
  className?: string;
}

/**
 * Mobile overlay component that displays guessed tags and remaining count.
 * Positioned in the top-right corner with 50% opacity.
 */
const MobileTagsOverlay: React.FC<Props> = ({ guessedTags, totalTags, className }) => {
  const remainingCount = totalTags - guessedTags.length;

  return (
    <MobileTagsOverlayContainer className={className}>
      <RemainingCount>
        {remainingCount} tag{remainingCount !== 1 ? 's' : ''} remaining
      </RemainingCount>
      {guessedTags.length > 0 && (
        <GuessedTagsList>
          {guessedTags.map((tag, index) => (
            <GuessedTagItem key={`${tag.name}-${index}`}>
              <VisibleTag tag={tag} />
            </GuessedTagItem>
          ))}
        </GuessedTagsList>
      )}
    </MobileTagsOverlayContainer>
  );
};

const MobileTagsOverlayContainer = styled.div`
  position: fixed;
  top: 8px;
  right: 8px;
  max-width: 45%;
  max-height: 40vh;
  overflow-y: auto;
  
  background: rgba(31, 60, 103, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 8px;
  z-index: 10;
  
  color: rgba(180, 199, 217, 0.9);
`;

const RemainingCount = styled.p`
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
  color: ${p => p.theme.cTagSpecies};
`;

const GuessedTagsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const GuessedTagItem = styled.li`
  font-size: 0.7rem;
  padding: 2px 0;
  border-bottom: 1px solid rgba(180, 199, 217, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

export default MobileTagsOverlay;
