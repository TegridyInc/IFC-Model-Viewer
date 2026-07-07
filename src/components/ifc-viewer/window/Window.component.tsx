import { useRef, MouseEvent, ReactNode, RefObject, MouseEventHandler, useEffect } from 'react';
import { styled } from '@mui/material'
import { IconButton } from '../inputs/Buttons';

import { EventDispatcher } from 'three';

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

const Window = styled('div')(({theme})=>({
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

const WindowHeader = styled('div')(({theme})=> ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 'calc(100% - 6px)',
    height: '30px',
    padding: '3px',
    background: theme.palette.primary.main,
    border: `0 solid ${theme.palette.secondary.main}`,
    borderBottomWidth: 1,
}))

const WindowLabel = styled('div', {target: 'unselectable'})({
    display: 'flex',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontWeight: 'bold',
    textWrap: 'nowrap',
})

const WindowContainer = styled('div')(({theme})=> ({
   display: 'flex',
   flexDirection: 'column',
   boxSizing: 'border-box',
   minWidth: '250px',
   maxHeight: '80vh',
   padding: '7px',
   background: theme.palette.secondary.light,
   overflow: 'hidden overlay',
   resize: 'both', 

   '&:empty': {
        padding: '0px'  
   }
}))

export default WindowComponent;