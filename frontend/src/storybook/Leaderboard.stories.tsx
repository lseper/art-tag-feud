import type { Meta, StoryObj } from '@storybook/react';
import Leaderboard from '../components/Leaderboard';
import { UserContext } from '../contexts/UserContext';
import { ConnectionManager } from '../util/ConnectionManager';
import React from 'react';

// Mock connection manager
const mockConnectionManager = {
  send: () => {},
  listen: () => () => {},
  connecting: false,
} as unknown as ConnectionManager;

const mockUserContextWithPlayers = {
  userID: 'test-user-1',
  username: 'TestUser',
  score: 250,
  roomID: 'test-room-1',
  roomName: 'Test Room',
  icon: 'krystal.jpg',
  readyStates: [
    {
      user: {
        id: 'user-1',
        username: 'Rory',
        score: 589,
        icon: 'krystal.jpg',
      },
      ready: true,
      icon: 'krystal.jpg',
    },
    {
      user: {
        id: 'user-2',
        username: 'Zaverose',
        score: 504,
        icon: 'anubis.jpg',
      },
      ready: true,
      icon: 'anubis.jpg',
    },
    {
      user: {
        id: 'user-3',
        username: 'Daitarou',
        score: 399,
        icon: 'falco.jpg',
      },
      ready: true,
      icon: 'falco.jpg',
    },
    {
      user: {
        id: 'user-4',
        username: 'Hawk',
        score: 250,
        icon: 'legosi.png',
      },
      ready: true,
      icon: 'legosi.png',
    },
    {
      user: {
        id: 'user-5',
        username: 'Mason',
        score: 82,
        icon: 'bowser.jpg',
      },
      ready: true,
      icon: 'bowser.jpg',
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

const meta: Meta<typeof Leaderboard> = {
  title: 'Components/Leaderboard',
  component: Leaderboard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <UserContext.Provider value={mockUserContextWithPlayers}>
        <Story />
      </UserContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Leaderboard>;

export const WithPlayers: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => {
      const emptyContext = {
        ...mockUserContextWithPlayers,
        readyStates: [],
      };
      return (
        <UserContext.Provider value={emptyContext}>
          <Story />
        </UserContext.Provider>
      );
    },
  ],
};

export const SinglePlayer: Story = {
  decorators: [
    (Story) => {
      const singlePlayerContext = {
        ...mockUserContextWithPlayers,
        readyStates: [mockUserContextWithPlayers.readyStates[0]],
      };
      return (
        <UserContext.Provider value={singlePlayerContext}>
          <Story />
        </UserContext.Provider>
      );
    },
  ],
};
