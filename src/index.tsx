import * as _ from 'lodash';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import Viewer from './components/ifc-viewer/Viewer';
import { styled, ThemeProvider, useColorScheme, useMediaQuery } from '@mui/material'
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    shadow: Palette['primary'];
  }

  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    shadow?: PaletteOptions['primary'];
  }
}

export const theme = createTheme({
  colorSchemes: {
    // dark: {
    //   palette: {
    //     primary: {
    //       main: '#171717',
    //     },
    //     secondary: {
    //       main: '#141414',
    //     },
    //     accent: {
    //       main: '#8224ed',
    //     },
    //     text: {
    //       primary: '#fff',
    //     },
    //     shadow: {
    //       main: '#000'
    //     }
    //   },
    // },

    light: {
      palette: {
        primary: {
          main: '#ffffff',
        },
        secondary: {
          main: '#dddddd',
        },
        accent: {
          main: '#04A7F0',
        },
        text: {
          primary: '#000000',
        },
        shadow: {
          main: '#000'
        }
      },
      
    }
  },

  typography: {
    fontFamily: [
      'Arial',
      'sans-serif'
    ].join(','),
    fontSize: 12
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

const ViewerContainer = styled('div')({
  width: 800,
  height: 600
})

const App = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    return (
      <ThemeProvider theme={theme} colorSchemeStorageKey={prefersDarkMode ? 'dark' : 'light'}>
        <Root>
          <ViewerContainer>
            <Viewer/>
          </ViewerContainer>
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