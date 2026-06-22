import type { Meta, StoryObj } from '@storybook/react';
import InRoundLeaderboard from '../components/InRoundLeaderboard';
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
      ready: false,
      icon: 'krystal.jpg',
    },
    {
      user: {
        id: 'user-2',
        username: 'Zaverose',
        score: 504,
        icon: 'anubis.jpg',
      },
      ready: false,
      icon: 'anubis.jpg',
    },
    {
      user: {
        id: 'user-3',
        username: 'Daitarou',
        score: 399,
        icon: 'falco.jpg',
      },
      ready: false,
      icon: 'falco.jpg',
    },
    {
      user: {
        id: 'user-4',
        username: 'Hawk',
        score: 250,
        icon: 'legosi.png',
      },
      ready: false,
      icon: 'legosi.png',
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

const meta: Meta<typeof InRoundLeaderboard> = {
  title: 'Components/InRoundLeaderboard',
  component: InRoundLeaderboard,
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
type Story = StoryObj<typeof InRoundLeaderboard>;

export const InProgress: Story = {};

export const WithFinishedPlayers: Story = {
  decorators: [
    (Story) => {
      const contextWithFinished = {
        ...mockUserContextWithPlayers,
        readyStates: [
          {
            ...mockUserContextWithPlayers.readyStates[0],
            ready: true,
          },
          {
            ...mockUserContextWithPlayers.readyStates[1],
            ready: true,
          },
          mockUserContextWithPlayers.readyStates[2],
          mockUserContextWithPlayers.readyStates[3],
        ],
      };
      return (
        <UserContext.Provider value={contextWithFinished}>
          <Story />
        </UserContext.Provider>
      );
    },
  ],
};

export const AllFinished: Story = {
  decorators: [
    (Story) => {
      const contextAllFinished = {
        ...mockUserContextWithPlayers,
        readyStates: mockUserContextWithPlayers.readyStates.map(rs => ({
          ...rs,
          ready: true,
        })),
      };
      return (
        <UserContext.Provider value={contextAllFinished}>
          <Story />
        </UserContext.Provider>
      );
    },
  ],
};
