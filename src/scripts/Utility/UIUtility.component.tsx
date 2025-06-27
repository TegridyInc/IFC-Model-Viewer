import { JSX } from 'react/jsx-runtime';
import { useState, useRef, MouseEvent, ReactNode, RefObject, MouseEventHandler, useEffect } from 'react';
import * as MAT from '@mui/material'
import { EventDispatcher, Event } from 'three';

//#region Foldout

export const FoldoutComponent = (props: { name: string, inputLabel?: boolean, sx?:MAT.SxProps, children?:JSX.Element[] | JSX.Element, header?:JSX.Element, onOpen?: () => void, onClosed?: () => void }) => {
    const [expanded, setExpansion] = useState(false);
   
    const foldoutExpand = useRef(undefined)
    const foldoutContainer = useRef(undefined)
    const foldoutHeader = useRef(undefined)
    
    const handleExpansion = (e:MouseEvent) => {
        if(e.target != foldoutHeader.current) 
            return;
            
        setExpansion((oldValue)=>!oldValue)
        
        foldoutExpand.current.style.transform = !expanded ? 'rotate(0deg)' : 'rotate(180deg)';
        foldoutContainer.current.style.marginTop = !expanded ? '5px' : '0px';

        if (!expanded && props.onOpen)
            props.onOpen();
        else if (props.onClosed)
            props.onClosed();
    }

    return (
        <Foldout sx={props.sx}>
            <FoldoutHeader ref={foldoutHeader} onClick={handleExpansion}>
                {
                    props.inputLabel ? <FoldoutLabelInput color='primary' defaultValue={props.name} variant='standard'/> : <FoldoutLabel>{props.name}</FoldoutLabel>
                }
                {props.header}
                <FoldoutExpand ref={foldoutExpand}>keyboard_arrow_up</FoldoutExpand>
            </FoldoutHeader>
            <FoldoutContainer ref={foldoutContainer} in={expanded} timeout="auto">
                <MAT.Stack divider={<MAT.Divider sx={{opacity: 1, backgroundColor: 'theme.palette.secondary.light'}} flexItem variant='fullWidth' />}>
                    {props.children}
                </MAT.Stack>
            </FoldoutContainer>
        </Foldout>
    ) 
}

const Foldout = MAT.styled(MAT.List)(({theme})=> ({
    boxSizing: 'border-box',
    width: '100%',
    rowGap: '10px',
    backgroundColor: theme.palette.secondary.main,
    borderRadius: '5px',
    padding: '5px'
}))

const FoldoutHeader = MAT.styled('div')({
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px',
})

const FoldoutLabel = MAT.styled('div', {target: 'unselectable'})({
    paddingLeft: '5px',
    marginRight: 'auto',
    pointerEvents: 'none',
    fontWeight: '300',
    overflow: 'hidden'
})

const FoldoutLabelInput = MAT.styled(MAT.TextField)({
    paddingLeft: '5px',
    marginRight: 'auto',
    fontWeight: '300',
    overflow: 'hidden',
    color: 'white',

    '*': {
        color: 'white !important'
    }
})

const FoldoutContainer = MAT.styled(MAT.Collapse)(({theme})=> ({
    height: 0,
    transition: 'height 0.1s',
    border: `1px solid ${theme.palette.secondary.light}`,
    borderRadius: '5px',
    boxShadow: '1px 1px 3px black'
}))

const FoldoutExpand = MAT.styled('div', {target: 'material-symbols-outlined unselectable'})({
   transform: 'rotate(180deg)',
   pointerEvents: 'none',
})

export const FoldoutElementComponent = (props: {label: string, value?: string}) => {
    return (
        <FoldoutElement>
            <FoldoutLabel>{props.label}</FoldoutLabel>
            {
                props.value != undefined ? <FoldoutValue>{props.value}</FoldoutValue> : <></> 
            }
        </FoldoutElement>
    )
}

const FoldoutElement = MAT.styled('div')({
    display: 'flex',
    flexDirection: 'row',
    fontSize: 'smaller',
    padding: '2px'
})

const FoldoutValue = MAT.styled('div')({
    display: 'flex',
    marginLeft: 'auto'
})

//#endregion

//#region Window

interface WindowDispatcher {
    onWindowMoved: {
        target: WindowData
        event: MouseEvent
    };
}

export class WindowData extends EventDispatcher<WindowDispatcher> {
    root:  HTMLDivElement;
    header: HTMLDivElement;
    label: HTMLDivElement;
    container: HTMLDivElement;

    constructor(Root: HTMLDivElement, Header: HTMLDivElement, Label: HTMLDivElement, Container: HTMLDivElement) {
        super();

        this.root = Root;
        this.header = Header;
        this.label = Label;
        this.container = Container;
    }
}

export var OnWindowAdded: CustomEvent<WindowData>;

export const WindowComponent = (props: { children?: ReactNode[] | ReactNode, label: string, root?: RefObject<HTMLDivElement>, container?: RefObject<HTMLDivElement>, onClose?: MouseEventHandler }) => {
    var rootRef: RefObject<HTMLDivElement>;
    var containerRef: RefObject<HTMLDivElement>;
    const headerRef = useRef<HTMLDivElement>(undefined);
    const labelRef = useRef<HTMLDivElement>(undefined);

    rootRef = props.root ? props.root : useRef(undefined);
    containerRef = props.container ? props.container : useRef(undefined);

    var windowData: WindowData;
    var xOffset = 0;
    var yOffset = 0;

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            windowData = new WindowData(rootRef.current, headerRef.current, labelRef.current, containerRef.current)
            
            OnWindowAdded = new CustomEvent('onWindowAdded', {detail: windowData})
            document.dispatchEvent(OnWindowAdded)
        }
    }, [])

    const handleWindow = (e: MouseEvent<HTMLDivElement>)=>{
        xOffset = rootRef.current.offsetLeft - e.clientX;
        yOffset = rootRef.current.offsetTop - e.clientY;

        document.addEventListener('mousemove', moveWindowFunc);
        document.addEventListener('mouseup', ()=>{
            document.removeEventListener('mousemove', moveWindowFunc)
        }, {once: true})
    }
        
    const moveWindowFunc = (e: any) => {
        rootRef.current.style.top = `${e.clientY + yOffset}px`;
        rootRef.current.style.left = `${e.clientX + xOffset}px`;
    };
    
    const closeWindow = (e:MouseEvent)=>{
        rootRef.current.style.visibility = 'hidden' 
        if(props.onClose)
            props.onClose(e)
        
    }

    return (
        <Window ref={rootRef}>
            <WindowHeader ref={headerRef} onMouseDown={handleWindow}>
                <WindowLabel ref={labelRef}>{props.label}</WindowLabel>
                <IconButton onClick={closeWindow}>close</IconButton>
            </WindowHeader>
            <WindowContainer ref={containerRef}>
                {props.children ? props.children : <></>}
            </WindowContainer>
        </Window> 
    );
}

const Window = MAT.styled('div')(({theme})=>({
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: '10%',
    left: '10%',
    visibility: 'hidden',
    border: `1px solid ${theme.palette.accent.main}`,
    borderRadius: '5px',
    background: 'black',
    overflow: 'hidden',
    alignItems: 'stretch',
    zIndex: 1000,
}))

const WindowHeader = MAT.styled('div')(({theme})=> ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 'calc(100% - 6px)',
    height: '30px',
    padding: '3px',
    background: theme.palette.secondary.main
}))

const WindowLabel = MAT.styled('div', {target: 'unselectable'})({
    display: 'flex',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontWeight: 'bold',
    textWrap: 'nowrap',
})

const WindowContainer = MAT.styled('div')(({theme})=> ({
   display: 'flex',
   flexDirection: 'column',
   boxSizing: 'border-box',
   minWidth: '250px',
   maxHeight: '80vh',
   padding: '7px',
   background: theme.palette.primary.main,
   overflow: 'hidden overlay',
   resize: 'both', 

   '&:empty': {
        padding: '0px'  
   }
}))

//#endregion

export const IconButton = MAT.styled(MAT.IconButton, {target: 'material-symbols-outlined'})(({theme})=>({
   color: theme.palette.text.primary,
   height: 'auto',
   padding: '5px',
   fontSize: '20px !important',
   borderRadius: '5px',
   backgroundColor: theme.palette.secondary.main,
   boxShadow: `1px 1px 3px 0px ${theme.palette.secondary.dark}`,
   border: `1px solid ${theme.palette.secondary.light}`,
}))

export const BigButton = MAT.styled(MAT.Button)(({theme})=> ({
    color: theme.palette.text.primary,
    width: 'calc(100% - 10px)',
    height: '20px',
    padding: '5px',
    backgroundColor: theme.palette.secondary.main,
    boxSizing: 'content-box',
    border: `1px solid ${theme.palette.secondary.light}`
}))

export const ToggleButton = MAT.styled(MAT.ToggleButton, {target: 'material-symbols-outlined'})(({theme})=>({
    color: theme.palette.secondary.contrastText,
    height: 'auto',
    padding: '5px',
    fontSize: '20px !important',
    backgroundColor: theme.palette.secondary.main,
    boxShadow: `1px 1px 3px 0px ${theme.palette.secondary.dark}`,
    border: `1px solid ${theme.palette.secondary.light}`,
   
    '&.Mui-selected': {
        color: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.contrastText,

        '&:hover': {
            backgroundColor: theme.palette.secondary.light,
        }
    },
    
    '&:hover': {
        backgroundColor: theme.palette.secondary.light
    }
}))

export const ColorInput = MAT.styled('input')(({theme}) => ({
    aspectRatio: 1,
    width: 'unset',
    background: 'unset',
    outline: '0',
    appearance: 'none',
    border: `1px solid ${theme.palette.secondary.light}`,
    backgroundColor: theme.palette.secondary.main,
    boxSizing: 'content-box',
    padding: '5px',
    margin: '2px',
    borderRadius: '5px',
    height: '20px',
    boxShadow: `1px 1px 3px 0px ${theme.palette.secondary.dark}`,

    '&::-webkit-color-swatch-wrapper': {
        padding: '0'
    },

    '&::-webkit-color-swatch': {
        borderRadius: '5px',
        border: `1px solid ${theme.palette.text.primary}`,
    }
}));

export const SelectInput = MAT.styled(MAT.Select)(({theme})=> ({
    backgroundColor: theme.palette.secondary.main,
    color: 'white',

    '.MuiSelect-icon': {
        fill: 'rgb(255 255 255 / 36%)'
    },

    '.MuiFilledInput-input': {
        paddingBottom: '4px',
        paddingTop: '24px'
    }
}))

export const SelectLabel = MAT.styled(MAT.InputLabel)({
    color: '#909090'
})

const Slider = MAT.styled(MAT.Slider)(({theme})=>({
    overflow: 'unset',
    margin: '20px 25px 5px 25px',
    width: 'auto',
    color: theme.palette.text.primary,
}))

const SliderContainer = MAT.styled('div')({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
});

const SliderLabel = MAT.styled('div')(({theme})=> ({
    position: 'absolute',
    fontSize: '13px',
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.secondary.main,
    top: '5px',
    left: '15px'
}))

export const SliderComponent = (props: {label:string, defaultValue?:number, min?:number, max?:number, step?: number, onChange?:(event: Event, value: number)=>void})=>{
    const handleSliderChange = (e: Event, v: number) => {
        props.onChange(e, v)
    }

    return (
        <SliderContainer>
            <SliderLabel>{props.label}</SliderLabel>
            <Slider defaultValue={props.defaultValue} min={props.min} max={props.max} step={props.step} onChange={handleSliderChange} valueLabelDisplay='auto'/>
        </SliderContainer>
    )
}

export const Checkbox = MAT.styled(MAT.Checkbox)(({theme})=> ({
    backgroundColor: theme.palette.secondary.main,
    borderRadius: '5px',
    padding: '5px',
    height: '20px',
    width: '20px',
    boxSizing: 'content-box',
    border: `1px solid ${theme.palette.secondary.light}`,
    boxShadow: '1px 1px 3px 0px #202020',

    '&.Mui-checked': {
        color: theme.palette.secondary.contrastText,
    }
}))

export const CheckboxLabel = MAT.styled('div')({
    marginRight: 'auto'
})

export const CheckboxContainer = MAT.styled('div')({
    padding: '8px',
    display: 'flex',
    alignItems: 'center'
})