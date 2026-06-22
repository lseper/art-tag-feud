import type { Meta, StoryObj } from '@storybook/react';
import IconPicker from '../components/IconPicker';
import { UserContext } from '../contexts/UserContext';
import { ConnectionManager } from '../util/ConnectionManager';
import { icons } from '../util/UIUtil';
import React from 'react';

// Mock connection manager
const mockConnectionManager = {
  send: () => {},
  listen: () => () => {},
  connecting: false,
} as unknown as ConnectionManager;

const mockUserContext = {
  userID: 'test-user-1',
  username: 'TestUser',
  score: 0,
  roomID: 'test-room-1',
  roomName: 'Test Room',
  icon: undefined,
  readyStates: [],
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

const IconPickerWithContext = (args: { allIcons: typeof icons.nsfw }) => {
  return (
    <UserContext.Provider value={mockUserContext}>
      <IconPicker {...args} />
    </UserContext.Provider>
  );
};

const meta: Meta<typeof IconPicker> = {
  title: 'Components/IconPicker',
  component: IconPicker,
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
type Story = StoryObj<typeof IconPicker>;

export const Default: Story = {
  render: (args) => <IconPickerWithContext {...args} />,
  args: {
    allIcons: icons.nsfw,
  },
};

export const WithSelectedIcon: Story = {
  render: (args) => {
    const contextWithIcon = {
      ...mockUserContext,
      icon: 'krystal.jpg',
    };
    return (
      <UserContext.Provider value={contextWithIcon}>
        <IconPicker {...args} />
      </UserContext.Provider>
    );
  },
  args: {
    allIcons: icons.nsfw,
  },
};
