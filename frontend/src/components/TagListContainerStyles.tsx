import styled from 'styled-components';

export const TagListLabel = styled.h2`
  margin: 10px 0px 10px 0px;
`;

export const TagsInputContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr; 
  grid-template-rows: 1fr; 
  gap: 30px 10px;
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
`;

export const TagsList = styled.div`
  display: block;
  background-color: #1F3C67;

  flex: 1 1 auto;

  border-radius: 10px;

  font-size: 0.85em;

  padding: ${p => p.theme.pTagList};
`;
