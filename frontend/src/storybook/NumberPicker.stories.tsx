import type { Meta, StoryObj } from '@storybook/react';
import NumberPicker from '../components/NumberPicker';
import { useState } from 'react';

type NumberPickerProps = {
  title: string;
  options: number[];
  color: string;
  backgroundColor: string;
  singleSelect: boolean;
  selected: number[];
  setSelected: (newSelected: number[]) => void;
};

const meta: Meta<typeof NumberPicker> = {
  title: 'Components/NumberPicker',
  component: NumberPicker,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'color' },
    },
    backgroundColor: {
      control: { type: 'color' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NumberPicker>;

const NumberPickerWithState = (args: Omit<NumberPickerProps, 'selected' | 'setSelected'>) => {
  const [selected, setSelected] = useState<number[]>([]);
  return (
    <NumberPicker
      {...args}
      selected={selected}
      setSelected={setSelected}
    />
  );
};

export const SingleSelect: Story = {
  render: (args) => <NumberPickerWithState {...args} />,
  args: {
    title: 'Select a number',
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    color: '#00AA00',
    backgroundColor: '#1F3C67',
    singleSelect: true,
    selected: [],
  },
};

export const MultiSelect: Story = {
  render: (args) => <NumberPickerWithState {...args} />,
  args: {
    title: 'Select multiple numbers',
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    color: '#F2AC08',
    backgroundColor: '#1F3C67',
    singleSelect: false,
    selected: [],
  },
};

export const LargeRange: Story = {
  render: (args) => <NumberPickerWithState {...args} />,
  args: {
    title: 'Select from large range',
    options: Array.from({ length: 20 }, (_, i) => i + 1),
    color: '#b4c7d9',
    backgroundColor: '#1F3C67',
    singleSelect: false,
    selected: [],
  },
};
