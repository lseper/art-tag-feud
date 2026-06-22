import type { Meta, StoryObj } from '@storybook/react';
import { VisibleTagName } from '../components/VisibleTagName';
import { TagType } from '../types';

const meta: Meta<typeof VisibleTagName> = {
  title: 'Components/VisibleTagName',
  component: VisibleTagName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VisibleTagName>;

export const Artist: Story = {
  args: {
    name: 'example_artist',
    tagType: TagType.Enum.artist,
  },
};

export const Character: Story = {
  args: {
    name: 'example_character',
    tagType: TagType.Enum.character,
  },
};

export const Species: Story = {
  args: {
    name: 'example_species',
    tagType: TagType.Enum.species,
  },
};

export const General: Story = {
  args: {
    name: 'example_general_tag',
    tagType: TagType.Enum.general,
  },
};
