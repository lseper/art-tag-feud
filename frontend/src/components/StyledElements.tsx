import styled from 'styled-components';

export const TitleContainer = styled.div`
    margin: 10px;
    width: 480px;
    max-width: 98vw;
    border-radius: 5px;
    box-shadow: 0 0 5px #000;
    text-shadow: 0 0 2px black, 0 0 6px black;
    z-index: 2;
`;

export const List = styled.ul`

    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    padding: 16px; 

    li {
        display: grid;
        grid-template-columns: 3fr 1fr 4fr;
        column-gap: 2.5rem;
        background-color: ${p => p.theme.cBodyLight};
        border-radius: 4px;
        width: calc(100% - 4rem);
        padding: 0 1rem 0.25rem 1rem;
    }
`;

export const Header = styled.span`
    width: 75%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-self: flex-start;
    padding-left: 32px;
`;

export const TitleText = styled.h1`
    font-size: 2em;
    color: #b4c7d9;
    text-decoration: none;
    
    @media (min-width: 800px) {
        font-size: 3.5em;
    }
`;

export const Container = styled.div`

    display: flex;
    flex-direction: column;
    align-items: center;

    /* TODO make responsive */
    @media (min-width: 1600px) {
        display: grid; 
        grid-template-columns: 1fr 0.5fr 1fr; 
        grid-template-rows: 2.25fr 2.25fr 0.75fr; 
        grid-template-areas:
        '. . rooms'
        '. e6-join rooms'
        '. e6-create rooms';
        column-gap: 2.5rem;
    }

    text-align: center;
    position: absolute;
    top: 16em;
    left: 0;
    right: 0;
    
    padding: 0 0 4em 0;

    a {
        color: #a3bcd3;
        text-decoration: none;
        padding: 0.25rem 0.25rem;
        border: 0;
        font-family: inherit;
        font-size: 100%;
        line-height: 1.25em;
        margin: 0;
    }
    a:hover {
        color: #e9f2fa;
    }

    input {
        min-width: 8rem;
        border-radius: 2px;
        padding: 1px 4px;
        line-height: normal;
        font-size: 100%;
        margin: 0;
        vertical-align: middle;
        outline: none;
        cursor: pointer;
        border: 0px solid;
    }

    input:focus {
        background: #ffc;
        color: #000;
        outline: none;
    }

    button {
        min-width: 8rem;
        border-radius: 2px;
        padding: 1px 4px;
        line-height: normal;
        font-size: 100%;
        margin: 0;
        vertical-align: middle;
        outline: none;
        cursor: pointer;
        border: 0px solid;
    }

    button:focus {
        background: #ffc;
        color: #000;
        outline: none;
    }
`