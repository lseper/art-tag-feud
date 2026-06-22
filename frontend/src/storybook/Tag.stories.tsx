import type { Meta, StoryObj } from '@storybook/react';
import Tag from '../components/Tag';
import { TagType } from '../types';

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Artist: Story = {
  args: {
    tag: {
      name: 'example_artist',
      type: TagType.Enum.artist,
      score: 42,
    },
  },
};

export const Character: Story = {
  args: {
    tag: {
      name: 'example_character',
      type: TagType.Enum.character,
      score: 100,
    },
  },
};

export const Species: Story = {
  args: {
    tag: {
      name: 'example_species',
      type: TagType.Enum.species,
      score: 75,
    },
  },
};

export const General: Story = {
  args: {
    tag: {
      name: 'example_general_tag',
      type: TagType.Enum.general,
      score: 50,
    },
  },
};

export const Hidden: Story = {
  args: {
    tag: undefined,
  },
};
