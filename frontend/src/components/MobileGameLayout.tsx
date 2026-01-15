import type { ReactNode } from 'react';
import styles from '@/styles/components/mobile-game-layout.module.css';

interface Props {
  children: ReactNode;
}

/**
 * Mobile game layout wrapper that provides fullscreen positioning context
 * for the game view on mobile devices.
 */
const MobileGameLayout: React.FC<Props> = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

export default MobileGameLayout;
