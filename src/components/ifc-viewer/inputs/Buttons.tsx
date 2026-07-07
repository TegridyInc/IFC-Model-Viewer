import { 
    styled, 
    IconButton as MatIconButton, 
    Button as MatButton, 
    ToggleButton as MatToggleButton, 
} from '@mui/material'

export const Button = styled(MatButton)(({theme})=> ({
    color: theme.palette.text.primary,
    height: 'auto',
    padding: '5px',
    fontSize: '16px !important',
    borderRadius: '5px',
    backgroundColor: theme.palette.primary.main,
    minWidth: 0,

    '&:hover': {
        backgroundColor: theme.palette.secondary.light
    }
}))

export const IconButton = styled(Button, {target: 'material-symbols-outlined'})(({theme})=>({
    color: theme.palette.text.primary,
    height: 'auto',
    padding: '5px',
    fontSize: '16px !important',
    borderRadius: '5px',
    backgroundColor: theme.palette.primary.main,

    '&:hover': {
        backgroundColor: theme.palette.secondary.light
    }
}))

export const BigButton = styled(Button)(({theme})=> ({
    color: theme.palette.text.primary,
    width: 'calc(100% - 10px)',
    height: '20px',
    padding: '5px',
    backgroundColor: theme.palette.secondary.main,
    boxSizing: 'content-box',
    minWidth: 0,

    '&:hover': {
        backgroundColor: theme.palette.secondary.light
    }
}))

export const ToggleButton = styled(MatToggleButton, {target: 'material-symbols-outlined'})(({theme})=>({
    color: theme.palette.text.primary,
    height: 'auto',
    padding: '5px',
    backgroundColor: theme.palette.primary.main,
    fontSize: '16px !important',
    minWidth: 0,
    border: 0,

    '&:hover': {
        backgroundColor: theme.palette.secondary.main
    },
    
    '&.Mui-selected': {
        color: theme.palette.primary.contrastText,
        backgroundColor: theme.palette.secondary.main,

        '&:hover': {
            backgroundColor: theme.palette.primary.dark
        }
    }
}))