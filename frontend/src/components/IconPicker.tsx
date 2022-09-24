import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Container, List, Header, TitleText, TitleContainer } from '../components/StyledElements';
import { GetSelectedIconsEventData, GetSelectedIconsEventDataToClient, JoinRoomEventDataToClient, LeaveRoomEventDataToClient, SetUserIconEventData, SetUserIconEventDataToClient, UserReadyState } from '../types';
import { EventType } from '../types';
import { icons, buildUIIconImg } from '../util/UIUtil';

type Props = {
  className?: string;
  allIcons: string[];
}

const IconPicker: React.FC<Props> = ({allIcons} : Props) => {
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
  const {userID, roomID, icon, setIcon, connectionManager, readyStates, setReadyStates} = useContext(UserContext);

  useEffect(() => {
    const onIconSelected = (data: SetUserIconEventDataToClient) => {
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

    const onAllSelectedIcons = (data: GetSelectedIconsEventDataToClient) => {
      console.log('setting initially selected icons');
      const newSelectedIcons = data.selectedIcons;
      console.log(newSelectedIcons);
      setSelectedIcons(newSelectedIcons);
    }

    const unsubscribers = [
        connectionManager.listen<SetUserIconEventDataToClient>(EventType.enum.SET_ICON, onIconSelected),
        connectionManager.listen<GetSelectedIconsEventDataToClient>(EventType.enum.GET_SELECTED_ICONS, onAllSelectedIcons),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
  }, [connectionManager, readyStates, selectedIcons, setReadyStates, setSelectedIcons]);

  const selectIcon = (gameIcon: string) => {
    if(userID && roomID && !selectedIcons.includes(gameIcon)) {
        const data: SetUserIconEventData = {type: EventType.enum.SET_ICON, userID, roomID, icon: gameIcon}
        setIcon(gameIcon);
        connectionManager.send(data);
    }
  }

  const getSelectedIcons = useCallback(() => {
    if(roomID) {
      const data : GetSelectedIconsEventData = {type: EventType.enum.GET_SELECTED_ICONS, roomID};
      connectionManager.send(data);
    }
  }, [connectionManager, roomID])

  useEffect(() => {
    // get selected icons on mount
    console.log('getting initial selected icons...')
    getSelectedIcons();
  }, [getSelectedIcons])

  return (
    <div style={{gridArea: 'icons', marginTop: 32}}>
        <IconList>
          {
            icons.map((gameIcon) => {
                let buttonClass;
                if(icon === gameIcon) {
                    buttonClass = 'selected';
                } else {
                    if(selectedIcons.includes(gameIcon)) {
                        buttonClass = 'disabled';
                    } else {
                        buttonClass = 'selectable';
                    }
                }
                return <li className={buttonClass}><button onClick={() => selectIcon(gameIcon)}>{buildUIIconImg('./profile_icons/', gameIcon)}</button></li>;
            })
          }
        </IconList>
    </div>
  );
}

// TODO: artist credit
const IconArtist = styled.p`
  opacity: 0;
  transition: opacity .2s;

  &:hover {
    opacity: 1
  }

  &:focus {
    opacity: 1;
  }
`

const IconList = styled.ul`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;

  li {
    position: relative;
    transition: filter .2s, transform .2s;
    &.disabled {
        filter: brightness(40%);
    }

    &.selected {
        filter: brightness(115%);
        transform: scale(1.25);
        z-index: 3;
    }

    &.selectable {
        filter: brightness(75%);
        vertical-align: middle;
        border-radius: 50%;
    }

    &.selectable:hover {
        transform: scale(1.5);
        filter: brightness(115%); 
        z-index: 99
    }

    &.selectable:focus {
        transform: scale(1.25);
        filter: brightness(115%);
    }
    button {
        background-color: transparent;
        border: none;
        box-shadow: 0;
        text-shadow: 0;
      img {
        width: 70px;
        height: 70px;
        border: 5px solid ${p => p.theme.cBodyLight};
        border-radius: 50%;
      }
    }
  }
`

export default IconPicker;