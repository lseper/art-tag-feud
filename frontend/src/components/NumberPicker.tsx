import { useCallback } from 'react';
import { TitleText } from '../components/StyledElements';
import styles from '@/styles/components/number-picker.module.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';


type Props = {
    title: string,
    options: number[],
    color: string,
    backgroundColor: string,
    singleSelect: boolean
    selected: number[],
    setSelected: (newSelected: number[]) => void,
    disabled?: boolean,
}

const NumberPicker : React.FC<Props> = ({options, color, backgroundColor, singleSelect, selected, setSelected, title, disabled} : Props) => {

    const select = useCallback((value: number) => {
        if (disabled) {
            return;
        }
        if(singleSelect) {
            setSelected([value]);
        } else {
            setSelected([...selected, value]);
        }
    }, [disabled, selected, setSelected, singleSelect]);

    const unselect = useCallback((value: number) => {
        if (disabled) {
            return;
        }
        setSelected(selected.filter(item => item !== value));
    }, [disabled, selected, setSelected]);

    return <div className={styles.wrapper}>
        <Title>
            {title}
        </Title>
        <ol className={styles.list} style={{ ['--picker-color' as string]: color }}>
        {
            options.map(option => {
                if(selected.includes(option)) {
                    return (
                      <Button
                        key={option}
                        onClick={() => unselect(option)}
                        className={`${styles.pickable} ${styles.selected}`}
                        style={{
                          ['--picker-color' as string]: color,
                          ['--picker-bg' as string]: backgroundColor,
                        }}
                        variant="outline"
                        size="icon"
                        disabled={disabled}
                      >
                        {option}
                      </Button>
                    );
                }
                return (
                  <Button
                    key={option}
                    onClick={() => select(option)}
                    className={styles.pickable}
                    style={{
                      ['--picker-color' as string]: color,
                      ['--picker-bg' as string]: backgroundColor,
                    }}
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                  >
                    {option}
                  </Button>
                );
            })
        }
        </ol>
    </div>;

}

export const Title = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <TitleText className={cn(styles.title, className)} {...props} />
);

export default NumberPicker;