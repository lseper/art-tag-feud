import { UserContext } from '../contexts/UserContext';
import { useContext, useState, useEffect, useCallback } from 'react';
import type { GetSelectedIconsEventDataType, GetSelectedIconsEventDataToClientType, SetUserIconEventDataType, SetUserIconEventDataToClientType } from '../types';
import { EventType } from '../types';
import { buildUIIconImg } from '../util/UIUtil';
import type {IconData} from '../util/UIUtil';
import styles from '@/styles/components/icon-picker.module.css';
import { Button } from '@/components/ui/button';

type Props = {
  className?: string;
  allIcons: IconData[];
}

const IconPicker: React.FC<Props> = ({allIcons} : Props) => {
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
  const {userID, roomID, icon, setIcon, connectionManager, readyStates, setReadyStates} = useContext(UserContext);

  useEffect(() => {
    const onIconSelected = (data: SetUserIconEventDataToClientType) => {
        const {icon, pastIcon } = data;
        const iconSetterUserID = data.userID;
        let newSelectedIcons = icon ? [...selectedIcons, icon] : [...selectedIcons];
        if(pastIcon) {
            newSelectedIcons = newSelectedIcons.filter(selectedIcon => selectedIcon !== pastIcon);
        }
        setSelectedIcons(newSelectedIcons);
        const userToChangeIcon = readyStates.find(readyState => readyState.user.id === iconSetterUserID);
        if(userToChangeIcon && icon) {
            userToChangeIcon.icon = icon;
            setReadyStates([...readyStates])
        }
    }

    const onAllSelectedIcons = (data: GetSelectedIconsEventDataToClientType) => {
      const newSelectedIcons = data.selectedIcons;
      setSelectedIcons(newSelectedIcons);
    }

    const unsubscribers = [
        connectionManager.listen<SetUserIconEventDataToClientType>(EventType.enum.SET_ICON, onIconSelected),
        connectionManager.listen<GetSelectedIconsEventDataToClientType>(EventType.enum.GET_SELECTED_ICONS, onAllSelectedIcons),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
  }, [connectionManager, readyStates, selectedIcons, setReadyStates, setSelectedIcons]);

  const selectIcon = (gameIcon: string) => {
    if(userID && roomID && !selectedIcons.includes(gameIcon)) {
        const data: SetUserIconEventDataType = {type: EventType.enum.SET_ICON, userID, roomID, icon: gameIcon}
        setIcon(gameIcon);
        connectionManager.send(data);
    }
  }

  const getSelectedIcons = useCallback(() => {
    if(roomID) {
      const data : GetSelectedIconsEventDataType = {type: EventType.enum.GET_SELECTED_ICONS, roomID};
      connectionManager.send(data);
    }
  }, [connectionManager, roomID])

  useEffect(() => {
    // get selected icons on mount
    getSelectedIcons();

  }, [getSelectedIcons])

  return (
        <ul className={styles.iconList}>
          {
            allIcons.map((gameIcon, index) => {
                let buttonClass: 'selected' | 'disabled' | 'selectable';
                if(icon === gameIcon.file) {
                    buttonClass = 'selected';
                } else {
                    if(selectedIcons.includes(gameIcon.file)) {
                        buttonClass = 'disabled';
                    } else {
                        buttonClass = 'selectable';
                    }
                }
                const stateClass = styles[buttonClass];
                return <li key={`icon-${index}`} className={`${styles.item} ${stateClass}`.trim()}>
                  <p className={styles.characterName}>{gameIcon.character}</p>
                  <Button className={styles.iconButton} variant="ghost" size="icon" onClick={() => selectIcon(gameIcon.file)}>
                    {buildUIIconImg(false, 'profile_icons/', gameIcon.file)}
                  </Button>
                  <a className={styles.iconArtist} href={gameIcon.source}>
                    <span style={{color: '#b4c7d9'}}>art by </span>
                    {gameIcon.artist}
                    </a>
                  </li>;
            })
          }
        </ul>
  );
}
export default IconPicker;