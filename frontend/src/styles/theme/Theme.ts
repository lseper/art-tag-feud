import reg from '../../images/e6TagGameMascot.png';
import blur from '../../images/e6TagGameMascotBlur.png';

/**
 * Theme for the application. Update with variables as needed!
 * Accessible via: ${props => props.theme.<name>} within a styled component.
 */
const Theme = {
  // colors
  cBodyLight: "#1F3C67",
  cTagArtist: "#F2AC08",
  cTagCharacter: "#00AA00",
  cTagSpecies: "#ED5D1F",
  cLobbyBackground: "rgb(0, 45, 85)",
  cPrimaryText: "#b4c7d9",
  cRankFirst: "#ffda38",
  cRankSecond: "#a3a3a3",
  cRankThird: "#e28c1c",

  // image paths
  bgImage: reg,
  bgImageBlur: blur,
  
  // padding
  pTagList: "10px",

  // margin
  mTag: "8px",

  // height
  inputHeight: "25px"
}

export default Theme;