import type { Preview } from '@storybook/react-vite'
import { ThemeProvider } from 'styled-components';
import theme from '../src/styles/theme/Theme';
import GlobalStyles from '../src/styles/theme/GlobalTheme';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <GlobalStyles theme={theme} />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
