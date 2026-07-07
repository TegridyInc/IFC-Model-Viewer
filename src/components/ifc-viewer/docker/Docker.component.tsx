import { viewportContext } from '@pim_platform/components/ifc-viewer/Viewer'
import { styled, Tab, Tabs } from '@mui/material';
import { useRef, useEffect, createContext, useState, useContext } from 'react';
import {WindowData} from '@pim_platform/components/ifc-viewer/window/Window.component'

const Docker = styled('div')<{ fullscreen: boolean, leftDocker: boolean, open: boolean }>(({theme, fullscreen, leftDocker, open}) => ({
    display: 'flex',
    position: 'absolute',
    flexDirection: 'column',
    width: open ? '400px' : '0 !important',
    height: fullscreen ? 'calc(100% - 100px)' : 'calc(100% - 20px)',
    top: fullscreen ? 'calc(50% + 18.5px)' : '50%',
    backgroundColor: theme.palette.primary.main,
    border: `0px solid ${theme.palette.secondary.light}`,
    borderWidth: open ? ((fullscreen && leftDocker) || (!fullscreen && !leftDocker) ? '1px 1px 1px 0px' : '1px 0px 1px 1px') : '0px',
    borderRadius: (fullscreen && leftDocker) || (!fullscreen && !leftDocker) ? '0px 5px 5px 0px' : '5px 0px 0px 5px' ,
    transform:'translateY(-50%)',

    left: fullscreen ? (leftDocker ? '0' : 'unset') : (leftDocker ? 'unset' : 'calc(100% + 2px)'),
    right: fullscreen ? (leftDocker ? 'unset' : '0') : (leftDocker ? 'calc(100% + 2px)' : 'unset'),
}))  

const DockerTabs = styled(Tabs)(({theme}) => ({
    height: '50px',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    boxSizing: 'border-box',
    overflow: 'hidden',
    minHeight: 'unset',

    '*.MuiTabs-indicator': {
        backgroundColor: theme.palette.accent.main
    },

    '*.MuiTabs-scroller': {
        height: '100%'
    },

    '*.MuiTabs-list': {
        height: '100%'
    }
}))

const DockerTab = styled(Tab)(({theme})=>({
    fontWeight: 'bold',
    fontSize: '16px',
    textTransform: 'none',
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.secondary.light,
    minHeight: 'unset',
    
    '&.Mui-selected': {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.primary.main,
        border: `0px solid ${theme.palette.secondary.light}`,
        borderBottomWidth: '1px',
    }
}))

const DockerContainers = styled('div')({
    height: '100%',
    width: '100%',
    overflow: 'hidden'
})

const DockerContainer = styled('div')({
    height: '100%',

    '& > *': {
        resize: 'none',
        width: '100%',
        height: '100%',
        maxHeight: 'unset',
    }
})

const DockerContainerComponent = (props: {windowData: WindowData, isHidden: boolean})=>{    
    const containerRef = useRef<HTMLDivElement>(undefined);

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

        }   
        containerRef.current.appendChild(props.windowData.container);
    })

    return ( 
        <DockerContainer ref={containerRef} hidden={props.isHidden}></DockerContainer> 
    )
}

const DockerResizer = styled('div')<{fullscreen: boolean, leftDocker: boolean, open: boolean}>(({fullscreen, leftDocker, open}) => ({
    position: 'absolute',
    display: open ? 'block' : 'none',
    top: 0,
    height: '100%',
    width: '6px',
    cursor: 'w-resize',
    boxShadow: '1px',

    right: (leftDocker && !fullscreen) || (!leftDocker && fullscreen) ? 'unset' : '0',
    left: (leftDocker && !fullscreen) || (!leftDocker && fullscreen) ? '0' : 'unset',
}))

const DockerCloser = styled('div', {target: 'material-symbols-outlined unselectable'})<{fullscreen: boolean, leftDocker: boolean, open: boolean}>(({theme, fullscreen, leftDocker, open}) =>({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '25px !important',
    background: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.secondary.light}`,
    borderWidth: open ? '1px' : ((leftDocker && !fullscreen) || (!leftDocker && fullscreen) ? '1px 0px 1px 1px' : '1px 1px 1px 0px'),
    borderRadius: (leftDocker && !fullscreen) || (!leftDocker && fullscreen) ? '5px 0px 0px 5px' : '0px 5px 5px 0px',
    padding: '10px 0px',

    right: fullscreen ? (leftDocker ? 'unset' : '100%') : (leftDocker ? '100%' : 'unset'),
    left: fullscreen ? (leftDocker ? '100%' : 'unset') : (leftDocker ? 'unset' : '100%'),

}))

export const DockerComponent = (props: {isLeftDocker: boolean}) => {
    const dockerRef = useRef<HTMLDivElement>(undefined)
    const dockerTabsRef = useRef<HTMLDivElement>(undefined)
    const dockerContainersRef = useRef<HTMLDivElement>(undefined)
    const dockerResizerRef = useRef<HTMLDivElement>(undefined)

    const [tabs, setTabs] = useState([])
    const [containers, setContainers] = useState([])
    const [value, setValue] = useState(0);
    const [isOpen, setIsOpen] = useState(true);
    const context = viewportContext();

    var viewport: HTMLElement;

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            document.addEventListener('onWindowAdded', (e:CustomEvent<WindowData>)=>{
                const window = e.detail;
                window.header.addEventListener('mousedown', ()=>{
                    document.addEventListener('mouseup', (e)=>{
                        handleWindowMovement(e, window)
                    }, {once: true})
                })
            })

            viewport = document.getElementById('viewport');
        }

        changeTabs(value)
    })

    const handleWindowMovement = (event: any, windowData: WindowData) => {
        const docker = dockerRef.current;

        const offsetLeft = docker.offsetLeft + viewport.offsetLeft;
        const offsetTop = docker.offsetTop + viewport.offsetTop - docker.offsetHeight / 2;

        if (event.clientX < offsetLeft || event.clientX > offsetLeft + docker.offsetWidth) {
            return;
        }

        if (event.clientY < offsetTop || event.clientY > offsetTop + docker.offsetHeight) {
            return;
        }

        addWindowToDocker(windowData)
    }

    const addWindowToDocker = (windowData: WindowData) => {
        const index = dockerContainersRef.current.childElementCount;
        
        const tab = (
            <DockerTab label={windowData.label.innerHTML} draggable onDragEnd={(e)=>{ removeTabFromDocker(windowData, e) }}/>
        );

        const container = (
            <DockerContainerComponent windowData={windowData} isHidden={index != 0}></DockerContainerComponent>
        )

        windowData.root.style.visibility = 'hidden'

        windowData.container.style.width = ''
        windowData.container.style.height = ''

        setTabs(oldTabs => [...oldTabs, tab])
        setContainers(oldContainers => [...oldContainers, container])
    }

    const removeTabFromDocker = (windowData: WindowData, mouseEvent: any)=>{
        const dockerContainer = windowData.container.parentElement;
        var index = -1;

        for(let i = 0; i < dockerContainersRef.current.children.length; i++) {
            if(dockerContainer == dockerContainersRef.current.children.item(i)) {
                index = i
                break;
            }
        }

        windowData.root.append(windowData.container);
        windowData.root.style.visibility = 'visible'
        windowData.root.style.top = `${mouseEvent.clientY - windowData.header.clientHeight / 2}px`;
        windowData.root.style.left = `${mouseEvent.clientX - windowData.root.clientWidth / 2}px`;

        setContainers(oldContainers => oldContainers.filter((v, i) => i != index))
        setTabs(oldTabs => oldTabs.filter((v, i) => i != index))

        handleWindowMovement(mouseEvent, windowData)
    }

    const changeTabs = (value: number) => {
        setValue(value)
        const children = dockerContainersRef.current.children;
        for (let i = 0; i < children.length; i++) {
            if(i == value) {
                children.item(i).removeAttribute('hidden');
            } else {
                children.item(i).setAttribute('hidden', 'hidden');
            }
        }
    }

    const resizeDocker = () => {
        const direction = props.isLeftDocker ? -1 : 1;
        
        const resize = (e: any)=> {
            dockerRef.current.style.width = (dockerRef.current.clientWidth + e.movementX * direction * (context.fullscreen ? -1 : 1)) + 'px';
        }

        document.addEventListener('mousemove', resize)
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize))
    }

    const toggleDocker = (e:any) => {
        setIsOpen(!isOpen);
    }

    return (
        <Docker ref={dockerRef} fullscreen={context.fullscreen} leftDocker={props.isLeftDocker} open={isOpen} >
            <DockerTabs variant="fullWidth" value={value} onChange={(e,v)=>{changeTabs(v)}} ref={dockerTabsRef}>{tabs}</DockerTabs>
            <DockerContainers ref={dockerContainersRef}>{containers}</DockerContainers>
            <DockerResizer ref={dockerResizerRef} fullscreen={context.fullscreen} leftDocker={props.isLeftDocker} open={isOpen} onMouseDown={resizeDocker}/>
            <DockerCloser onClick={toggleDocker} fullscreen={context.fullscreen} leftDocker={props.isLeftDocker} open={isOpen}>
                {
                    ((props.isLeftDocker && isOpen && !context.fullscreen) || (props.isLeftDocker && !isOpen && context.fullscreen)) ||
                    ((!props.isLeftDocker && !isOpen && !context.fullscreen) || (!props.isLeftDocker && isOpen && context.fullscreen)) ? 
                    'keyboard_arrow_right' : 'keyboard_arrow_left'
                }
            </DockerCloser>
        </Docker>
    )
}   

export default DockerComponent;