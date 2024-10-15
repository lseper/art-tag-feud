import nsfwReg from '../../images/nsfw/e6TagGameMascotNSFW.png';
import nsfwBlur from '../../images/nsfw/e6TagGameMascotBlurNSFW.png';
import sfwReg from '../../images/sfw/e6TagGameMascotSFW.png';
import sfwBlur from '../../images/sfw/e6TagGameMascotBlurSFW.png';

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
  bgImageNSFW: nsfwReg,
  bgImageBlurNSFW: nsfwBlur,
  bgImageSFW: sfwReg,
  bgImageBlurSFW: sfwBlur,
  
  // padding
  pTagList: "10px",

  // margin
  mTag: "8px",

  // height
  inputHeight: "25px"
}

export default Theme;