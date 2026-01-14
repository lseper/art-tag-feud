import styled from 'styled-components';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Mobile game layout wrapper that provides fullscreen positioning context
 * for the game view on mobile devices.
 */
const MobileGameLayout: React.FC<Props> = ({ children }) => {
  return <MobileGameContainer>{children}</MobileGameContainer>;
};

const MobileGameContainer = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background-color: black;
  overflow: hidden;
`;

export default MobileGameLayout;
