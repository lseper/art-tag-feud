import type { Meta, StoryObj } from '@storybook/react';
import TagList from '../components/TagList';
import { TagType } from '../types';

const meta: Meta<typeof TagList> = {
  title: 'Components/TagList',
  component: TagList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TagList>;

const sampleTags = [
  { name: 'artist_tag_1', type: TagType.Enum.artist, score: 42 },
  { name: 'character_tag_1', type: TagType.Enum.character, score: 100 },
  { name: 'species_tag_1', type: TagType.Enum.species, score: 75 },
  { name: 'general_tag_1', type: TagType.Enum.general, score: 50 },
  { name: 'artist_tag_2', type: TagType.Enum.artist, score: 30 },
  { name: 'character_tag_2', type: TagType.Enum.character, score: 80 },
];
const sampleUser = { id: 'user-1', username: 'Rin', score: 0, icon: 'krystal.jpg' };

export const AllHidden: Story = {
  args: {
    tags: sampleTags,
    guessedTags: [],
  },
};

export const PartiallyRevealed: Story = {
  args: {
    tags: sampleTags,
    guessedTags: [
      { tag: sampleTags[0], user: sampleUser },
      { tag: sampleTags[1], user: sampleUser },
    ],
  },
};

export const AllRevealed: Story = {
  args: {
    tags: sampleTags,
    guessedTags: sampleTags.map(tag => ({ tag, user: sampleUser })),
  },
};

export const Empty: Story = {
  args: {
    tags: [],
    guessedTags: [],
  },
};
