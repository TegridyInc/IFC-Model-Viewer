import { 
    styled, 
    Select
} from '@mui/material'

export const SelectInput = styled(Select)(({theme})=> ({
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.text.primary,

    '.MuiSelect-icon': {
        fill: 'rgb(255 255 255 / 36%)'
    },

    '.MuiFilledInput-input': {
        paddingBottom: '4px',
        paddingTop: '24px'
    }
}))