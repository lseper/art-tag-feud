import type { Meta, StoryObj } from '@storybook/react';
import { TagListContainer } from '../components/TagListContainer';
import { UserContext } from '../contexts/UserContext';
import { ConnectionManager } from '../util/ConnectionManager';
import { TagType } from '../types';
import React from 'react';

// Mock connection manager
const mockConnectionManager = {
  send: () => {},
  listen: () => () => {},
  connecting: false,
} as unknown as ConnectionManager;

const sampleTags = [
  { name: 'artist_tag_1', type: TagType.Enum.artist, score: 42 },
  { name: 'character_tag_1', type: TagType.Enum.character, score: 100 },
  { name: 'species_tag_1', type: TagType.Enum.species, score: 75 },
  { name: 'general_tag_1', type: TagType.Enum.general, score: 50 },
  { name: 'general_tag_2', type: TagType.Enum.general, score: 45 },
  { name: 'general_tag_3', type: TagType.Enum.general, score: 40 },
  { name: 'general_tag_4', type: TagType.Enum.general, score: 35 },
  { name: 'general_tag_5', type: TagType.Enum.general, score: 30 },
  { name: 'artist_tag_2', type: TagType.Enum.artist, score: 30 },
  { name: 'character_tag_2', type: TagType.Enum.character, score: 80 },
  { name: 'species_tag_2', type: TagType.Enum.species, score: 60 },
];

const mockUserContext = {
  userID: 'test-user-1',
  username: 'TestUser',
  score: 0,
  roomID: 'test-room-1',
  roomName: 'Test Room',
  icon: undefined,
  readyStates: [
    {
      user: {
        id: 'user-1',
        username: 'TestUser',
        score: 0,
        icon: 'krystal.jpg',
      },
      ready: false,
      icon: 'krystal.jpg',
    },
  ],
  owner: undefined,
  connectionManager: mockConnectionManager,
  setUserID: () => {},
  setUsername: () => {},
  setRoomID: () => {},
  setRoomName: () => {},
  setIcon: () => {},
  setReadyStates: () => {},
  setOwner: () => {},
  setScore: () => {},
  leaveRoomCleanup: () => {},
};

const meta: Meta<typeof TagListContainer> = {
  title: 'Components/TagListContainer',
  component: TagListContainer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <UserContext.Provider value={mockUserContext}>
        <Story />
      </UserContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagListContainer>;

export const Default: Story = {
  args: {
    tags: sampleTags,
  },
};

export const WithManyTags: Story = {
  args: {
    tags: [
      ...sampleTags,
      ...Array.from({ length: 20 }, (_, i) => ({
        name: `general_tag_${i + 6}`,
        type: TagType.Enum.general,
        score: 25 - i,
      })),
    ],
  },
};

export const Empty: Story = {
  args: {
    tags: [],
  },
};
