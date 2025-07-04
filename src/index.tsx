import * as _ from 'lodash';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import Viewer from './scripts/Viewer/Viewer';
import { styled, ThemeProvider, useColorScheme, useMediaQuery } from '@mui/material'
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }

  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

export const theme = createTheme({
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#272727',
        },
        secondary: {
          main: '#3d3d3d',
        },
        accent: {
          main: '#6835a1',
        },
        text: {
          primary: '#fff',
        }
      },
    },

    light: {
      palette: {
        primary: {
          main: '#aaaaaa',
        },
        secondary: {
          main: '#d8d8d8',
          light: '#fbfbfb',
        },
        accent: {
          main: '#0a93c4',
        },
        text: {
          primary: '#000',
        }
      },
      
    }
  },

  typography: {
    fontFamily: [
      'Arial',
      'sans-serif'
    ].join(',')
  }
});

const Root = styled('div')(({theme})=>({
  color: theme.palette.text.primary,
  width: '100%',
  height: '100%',
  margin: '0px',
  display: 'flex',
  overflow: 'hidden',
  backgroundColor: theme.palette.primary.dark,
  fontFamily: 'Arial, sans-serif',
  flexDirection: 'column',
}))

const App = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    return (
      <ThemeProvider theme={theme} colorSchemeStorageKey={prefersDarkMode ? 'dark' : 'light'}>
        <Root>
          <Viewer/>
        </Root>
      </ThemeProvider>
    )
}


ReactDOM.createRoot(document.querySelector("#root")!).render(
    <StrictMode>
        <StyledEngineProvider injectFirst>
            <App/>
        </StyledEngineProvider>
    </StrictMode>
);