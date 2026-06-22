import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../components/ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    percentComplete: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    totalTime: {
      control: { type: 'number' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Low: Story = {
  args: {
    percentComplete: 20,
    totalTime: 30,
  },
};

export const Medium: Story = {
  args: {
    percentComplete: 50,
    totalTime: 30,
  },
};

export const High: Story = {
  args: {
    percentComplete: 80,
    totalTime: 30,
  },
};

export const Complete: Story = {
  args: {
    percentComplete: 100,
    totalTime: 30,
  },
};
