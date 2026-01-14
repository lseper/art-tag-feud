import type { Meta, StoryObj } from '@storybook/react';
import { DisplayedPost } from '../components/DisplayedPost';

const meta: Meta<typeof DisplayedPost> = {
  title: 'Components/DisplayedPost',
  component: DisplayedPost,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DisplayedPost>;

export const WithPost: Story = {
  args: {
    post: {
      id: 12345,
      url: 'https://via.placeholder.com/400x600',
      tags: [],
    },
  },
};

export const WithoutPost: Story = {
  args: {
    post: undefined,
  },
};

export const WithImageUrl: Story = {
  args: {
    post: {
      id: 67890,
      url: 'https://picsum.photos/400/600',
      tags: [],
    },
  },
};
