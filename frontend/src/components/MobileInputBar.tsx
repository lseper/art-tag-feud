import styled from 'styled-components';
import type { FormEvent } from 'react';

interface Props {
  guess: string;
  setGuess: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

/**
 * Mobile input bar fixed at the bottom of the screen for entering guesses.
 */
const MobileInputBar: React.FC<Props> = ({ guess, setGuess, onSubmit, className }) => {
  return (
    <MobileInputBarContainer className={className}>
      <InputForm onSubmit={onSubmit}>
        <GuessInput
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess..."
          autoComplete="off"
          autoCapitalize="off"
        />
      </InputForm>
    </MobileInputBarContainer>
  );
};

const MobileInputBarContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: rgba(0, 45, 85, 0.95);
  z-index: 20;
`;

const InputForm = styled.form`
  display: flex;
  width: 100%;
`;

const GuessInput = styled.input`
  flex: 1;
  height: 44px;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 1rem;
  border: none;
  outline: none;
  background-color: white;
  color: #000;
  
  &:focus {
    background-color: #ffc;
  }
  
  &::placeholder {
    color: #888;
  }
`;

export default MobileInputBar;
