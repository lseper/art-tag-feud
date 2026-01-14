import type { Meta, StoryObj } from '@storybook/react';
import { VisibleTagScore } from '../components/VisibleTagScore';

const meta: Meta<typeof VisibleTagScore> = {
  title: 'Components/VisibleTagScore',
  component: VisibleTagScore,
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: { type: 'number' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VisibleTagScore>;

export const Low: Story = {
  args: {
    score: 10,
  },
};

export const Medium: Story = {
  args: {
    score: 50,
  },
};

export const High: Story = {
  args: {
    score: 100,
  },
};

export const VeryHigh: Story = {
  args: {
    score: 500,
  },
};
