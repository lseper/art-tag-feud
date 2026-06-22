import { createGlobalStyle } from "styled-components";
import Theme from "./Theme";

const GlobalStyles = createGlobalStyle<{ theme: typeof Theme }>`
  img {
    max-width: 100%;
    height: auto;
    border-radius: inherit;
  }

  body {
    margin: 0;
    background-color: ${p => p.theme.cLobbyBackground};
    font-family: Verdana, sans-serif;
    color: white;
    background-image: url('${p => p.theme.bgImageSFW}');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: 50% 30%;
    background-size: 100%;
  }

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: 2em;
    margin: 13px 0 5px 0;
  }

  h2 {
    font-size: 1.5em;
    margin: 0;
  }

  p {
    margin: 0;
  }
`;

export default GlobalStyles;