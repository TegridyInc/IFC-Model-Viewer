import { 
    styled, 
} from '@mui/material'

export const ColorInput = styled('input')(({theme}) => ({
    aspectRatio: 1,
    width: 'unset',
    background: 'unset',
    outline: '0',
    appearance: 'none',
    boxSizing: 'content-box',
    padding: '5px',
    margin: '2px',
    borderRadius: '5px',
    border: 0,
    height: '16px',

    '&::-webkit-color-swatch-wrapper': {
        padding: '0'
    },

    '&::-webkit-color-swatch': {
        borderRadius: '50%'
    },

    '&:hover': {
        backgroundColor: theme.palette.secondary.light
    }
}));

export default ColorInput;
