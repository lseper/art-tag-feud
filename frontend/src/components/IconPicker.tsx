import { UserContext } from '../contexts/UserContext';
import { useContext, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { GetSelectedIconsEventDataType, GetSelectedIconsEventDataToClientType, SetUserIconEventDataType, SetUserIconEventDataToClientType } from '../types';
import { EventType } from '../types';
import { icons, buildUIIconImg } from '../util/UIUtil';
import type {IconData} from '../util/UIUtil';

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
        <IconList>
          {
            icons.sfw.map((gameIcon) => {
                let buttonClass;
                if(icon === gameIcon.file) {
                    buttonClass = 'selected';
                } else {
                    if(selectedIcons.includes(gameIcon.file)) {
                        buttonClass = 'disabled';
                    } else {
                        buttonClass = 'selectable';
                    }
                }
                return <li className={buttonClass}>
                  <CharacterName>{gameIcon.character}</CharacterName>
                  <button onClick={() => selectIcon(gameIcon.file)}>{buildUIIconImg(true, 'profile_icons/', gameIcon.file)}</button>
                  <IconArtist href={gameIcon.source}>
                    <span style={{color: '#b4c7d9'}}>art by </span>
                    {gameIcon.artist}
                    </IconArtist>
                  </li>;
            })
          }
        </IconList>
  );
}

// TODO: artist credit
const IconArtist = styled.a`
  opacity: 0;
  transition: opacity .2s;
  text-decoration: none;
  &:hover {
    opacity: 1
  }

  &:focus {
    opacity: 0.5;
  }
`

const CharacterName = styled.p`
  font-size: 1rem;
  color: #b4c7d9;
  z-index: 4;
`

const IconList = styled.ul`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 32;

  @media (min-width: 450px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 450px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
  @media (min-width: 1000px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }

  li {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    margin: 8px;

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

    a {
      opacity: 0;
      transition: opacity .2s;
    }

    &:hover {
      a {
        opacity: 1;
      }
    }

    button {
        background-color: transparent;
        border: none;
        box-shadow: 0;
        text-shadow: 0;
      img {
        width: 40px;
        height: 40px;
        border: 5px solid ${p => p.theme.cBodyLight};
        border-radius: 50%;

        @media (min-width: 440px) {
          width: 50px;
          height: 50px;
        }

        @media (min-width: 800px) {
          width: 60px;
          height: 60px;
        }

        @media (min-width: 900px) {
          width: 70px;
          height: 70px;
        }

        @media (min-width: 1000px) {
          width: 80px;
          height: 80px;
        }
      }
    }

    p {
      font-size: 0.5rem;
      max-width: 105%;

      @media (min-width: 350px) {
        font-size: 0.75rem;
      }

      @media (min-width: 500px) {
        font-size: 1rem;
      }
    }

    a {
      opacity: 0;
      transition: opacity .2s;
      font-size: 0.5rem;
      max-width: 105%;

      &:hover {
        opacity: 1
      }

      &:focus {
        opacity: 0.5;
      }

      @media (min-width: 350px) {
        font-size: 0.75rem;
      }

      @media (min-width: 500px) {
        font-size: 1rem;
      }
    }
  }
`

export default IconPicker;