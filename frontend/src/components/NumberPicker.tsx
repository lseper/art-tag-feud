import { useCallback } from 'react';
import styled from 'styled-components';

import { TitleText } from '../components/StyledElements';


type Props = {
    title: string,
    options: number[],
    color: string,
    backgroundColor: string,
    singleSelect: boolean
    selected: number[],
    setSelected: (newSelected: number[]) => void,
}

const NumberPicker : React.FC<Props> = ({options, color, backgroundColor, singleSelect, selected, setSelected, title} : Props) => {

    const select = useCallback((value: number) => {
        if(singleSelect) {
            setSelected([value]);
        } else {
            setSelected([...selected, value]);
        }
    }, [selected, setSelected, singleSelect]);

    const unselect = useCallback((value: number) => {
        setSelected(selected.filter(item => item !== value));
    }, [selected, setSelected]);

    return <NumberPickerWrapper>
        <Title>
            {title}
        </Title>
        <NumberPickerList color={color}>
        {
            options.map(option => {
                if(selected.includes(option)) {
                    return <PickableNumber onClick={() => unselect(option)} className={'selected'} color={color} backgroundColor={backgroundColor}>{option}</PickableNumber>;
                }
                return <PickableNumber onClick={() => select(option)} color={color} backgroundColor={backgroundColor}>{option}</PickableNumber>
            })
        }
        </NumberPickerList>
    </NumberPickerWrapper>;

}

const NumberPickerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`;

export const Title = styled(TitleText)`
    align-self: flex-start;
    font-size: 1rem;
    @media (min-width: 900px) {
        font-size: 1.5rem;
    }
    @media (min-width: 1500px) {
        font-size: 2rem;
    }
`

type NumberPickerListStyleProps = {
    color: string,
}

const NumberPickerList = styled.ol<NumberPickerListStyleProps>`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;

    font-size: 1rem;
    color: ${p => p.color};
`

type PickableNumberStyleProps = {
    color: string,
    backgroundColor: string,
}

const PickableNumber = styled.button<PickableNumberStyleProps>`
    border-radius: 50%;
    background-color: ${p => p.backgroundColor};
    border: .1em solid ${p => p.color};
    transition: background-color .2s, transform .2s, color .2s, border .2s;
    color: ${p => p.color};

    font-size: .75rem;
    height: 2rem;
    width: 2rem;
    @media (min-width: 900px) {
        font-size: 1rem;
        height: 3rem;
        width: 3rem;
    }
    @media (min-width: 1500px) {
        font-size: 1.5rem;
        height: 4rem;
        width: 4rem;
    }
    margin: 8px;
    text-align: center;

    &:hover {
        color: ${p => p.backgroundColor};
        transform: scale(125%);
        border: .1em solid ${p => p.color};
        background-color: ${p => p.color};
    }

    &.selected {
        color: ${p => p.backgroundColor};
        background-color: ${p => p.color};
        transform: scale(115%);
        border: .1em solid ${p => p.color};
    }
`

export default NumberPicker;