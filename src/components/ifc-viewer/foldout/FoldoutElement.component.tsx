import { styled } from '@mui/material'

const FoldoutLabel = styled('div', {target: 'unselectable'})(({theme}) => ({
    minWidth: '40%',
    pointerEvents: 'none',
    fontWeight: '300',
    overflow: 'hidden',
    color: theme.palette.text.secondary,
    fontSize: '12px'
}))

const FoldoutElement = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    fontSize: 'smaller',
    padding: '5px 5px 5px 16px'
})

const FoldoutValue = styled('div')({
    display: 'flex',
    paddingLeft: '5px',
    fontSize: '12px'
})

export const FoldoutElementComponent = (props: {label: string, value?: string}) => {
    return (
        <FoldoutElement>
            <FoldoutLabel>{props.label}</FoldoutLabel>
            <FoldoutValue>{props.value ? props.value : ''}</FoldoutValue>
        </FoldoutElement>
    )
}

export default FoldoutElementComponent;