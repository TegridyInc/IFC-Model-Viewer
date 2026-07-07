import { 
    styled, 
    Checkbox as MatCheckbox 
} from '@mui/material'

export const Checkbox = styled(MatCheckbox)(({theme})=> ({
    borderRadius: '5px',
    padding: '5px',
    height: '20px',
    width: '20px',
    boxSizing: 'content-box',

    '&.Mui-checked': {
        color: theme.palette.secondary.contrastText,
    }
}))

export const CheckboxLabel = styled('div')({
    marginRight: 'auto',
    fontSize: 'small'
})

export const CheckboxContainer = styled('div')({
    display: 'flex',
    alignItems: 'center'
})