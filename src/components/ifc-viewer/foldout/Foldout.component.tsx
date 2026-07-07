import { useState, useRef, MouseEvent, JSX} from 'react';
import { 
    styled, 
    List,
    TextField,
    SxProps
} from '@mui/material'

const FoldoutLabel = styled('div')({
    paddingLeft: '5px',
    marginRight: 'auto',
    pointerEvents: 'none',
    fontWeight: '300',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center'
})

const Foldout = styled(List)<{addRightPadding: boolean}>(({theme, addRightPadding})=> ({
    boxSizing: 'border-box',
    width: '100%',
    rowGap: '10px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '5px',
    padding: `2px ${addRightPadding ? '5px' : '0px'} 2px 5px`
}))

const FoldoutHeader = styled('div')({
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
})

const FoldoutLabelInput = styled(TextField)({
    paddingLeft: '5px',
    marginRight: 'auto',
    fontWeight: '300',
    overflow: 'hidden',

    '& > .MuiInputBase-root': {
        fontSize: '13px'
    }
})

const FoldoutContainer = styled('div')<{expanded: boolean}>(({theme, expanded})=> ({
    display: expanded ? 'block' : 'none',
    marginLeft: '11px',
    paddingLeft: '11px',
    border: `0px solid ${theme.palette.secondary.main}`,
    borderLeftWidth: '1px'
}))

const FoldoutExpand = styled('div', {target: 'material-symbols-outlined unselectable'})(({theme}) => ({
   transform: 'rotate(90deg)',
   fontSize: '16px !important',
   borderRadius: '2px',
   padding: '3px',

   '&:hover': {
        backgroundColor: theme.palette.secondary.light
   }
}))

export const FoldoutComponent = (props: { label: string | JSX.Element | JSX.Element[], inputLabel?: boolean, sx?:SxProps, children?:JSX.Element[] | JSX.Element, header?:JSX.Element, onOpen?: () => void, onClosed?: () => void, addRightPadding?:boolean }) => {
    const [expanded, setExpansion] = useState(false);
   
    const foldoutExpand = useRef(undefined)
    const foldoutContainer = useRef(undefined)
    const foldoutHeader = useRef(undefined)
    
    const handleExpansion = (e:MouseEvent) => {            
        setExpansion((oldValue)=>!oldValue)
        
        foldoutExpand.current.style.transform = !expanded ? 'rotate(180deg)' : 'rotate(90deg)';
        foldoutContainer.current.style.marginTop = !expanded ? '5px' : '0px';

        if (!expanded && props.onOpen)
            props.onOpen();
        else if (props.onClosed)
            props.onClosed();
    }

    return (
        <Foldout sx={props.sx} addRightPadding={props.addRightPadding}>
            <FoldoutHeader ref={foldoutHeader}>
                <FoldoutExpand ref={foldoutExpand} onClick={handleExpansion}>keyboard_arrow_up</FoldoutExpand>
                {
                    typeof props.label == 'string' ? 
                    props.inputLabel ? <FoldoutLabelInput color='primary' defaultValue={props.label} variant='standard'/> : <FoldoutLabel>{props.label}</FoldoutLabel> : 
                    props.label
                }
                {props.header}
            </FoldoutHeader>
            <FoldoutContainer ref={foldoutContainer} expanded={expanded}>
                {props.children}
            </FoldoutContainer>
        </Foldout>
    ) 
}



export default FoldoutComponent;