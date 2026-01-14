import styled from 'styled-components';
import { media } from '../styles/theme/breakpoints';

export const TagListLabel = styled.h2`
  margin: 10px 0px 10px 0px;

  ${media.xl} {
    margin: 8px 0px 8px 0px;
    font-size: 1.3em;
  }

  ${media.lg} {
    margin: 6px 0px 6px 0px;
    font-size: 1.2em;
  }

  ${media.md} {
    font-size: 1.1em;
  }

  ${media.sm} {
    font-size: 1em;
  }

  ${media.xs} {
    font-size: 0.95em;
    margin: 4px 0px 4px 0px;
  }
`;

export const TagsInputContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr; 
  grid-template-rows: 1fr; 
  gap: 30px 10px;

  ${media.xl} {
    gap: 20px 8px;
  }

  ${media.lg} {
    gap: 15px 6px;
  }

  ${media.md} {
    grid-template-columns: 1fr 1.5fr;
    gap: 12px 5px;
  }

  ${media.sm} {
    gap: 10px 4px;
  }

  ${media.xs} {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 8px 0px;
  }
`;

export const TagsInput = styled.div`
  flex: 0 1 auto;
  padding: 0px 5px 5px 0px;
  font-size: 20px;
  border-radius: 10px;

  :focus {
    outline: none;
  }

  input {
    padding: 2px 2px 2px 5px;
    border-radius: 8px;
    height: ${p => p.theme.inputHeight};
    font-family: Verdana, sans-serif;
    font-size: .75em;
    font-weight: bold;
  }

  input:focus {
    outline: none;
  }

  ${media.xl} {
    font-size: 18px;
    padding: 0px 4px 4px 0px;
  }

  ${media.lg} {
    font-size: 16px;
  }

  ${media.md} {
    font-size: 15px;
    padding: 0px 3px 3px 0px;
  }

  ${media.sm} {
    font-size: 14px;
  }

  ${media.xs} {
    font-size: 13px;
    padding: 0px 2px 2px 0px;
  }
`;

export const TagsGrid = styled.div`
  display: grid; 
  grid-template-columns: 1fr 1fr 1fr; 
  grid-template-rows: 1fr; 
  gap: 0px 20px; 
  grid-template-areas: 
      ". .";

  padding-top: 5px;
  min-width: 90%;

  ${media.xl} {
    gap: 0px 15px;
  }

  ${media.lg} {
    gap: 0px 12px;
  }

  ${media.md} {
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
  }

  ${media.sm} {
    gap: 6px 8px;
  }

  ${media.xs} {
    grid-template-columns: 1fr;
    gap: 6px 0px;
  }
`;

export const TagsList = styled.div`
  display: block;
  background-color: #1F3C67;

  flex: 1 1 auto;

  border-radius: 10px;

  font-size: 0.85em;

  padding: ${p => p.theme.pTagList};

  ${media.xl} {
    padding: 8px;
    font-size: 0.8em;
  }

  ${media.lg} {
    padding: 7px;
    font-size: 0.75em;
  }

  ${media.md} {
    padding: 6px;
    border-radius: 8px;
  }

  ${media.sm} {
    padding: 5px;
    font-size: 0.7em;
  }

  ${media.xs} {
    padding: 4px;
    font-size: 0.65em;
    border-radius: 6px;
  }
`;
