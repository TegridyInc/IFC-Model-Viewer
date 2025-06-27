import * as Stats from 'stats.js';
import { IfcAPI } from 'web-ifc'

import { Icon, styled } from '@mui/material'
import { useRef, useState, MouseEvent, useEffect, createContext, useContext } from 'react';
import { BigButton, IconButton } from '../Utility/UIUtility.component';

import Container, {culler, world } from './Components';
import { IFCModel } from './IFC';

import ToolBar from './Toolbar'
import NotificationsComponent from './Notifications';
import ModelManager from '../Functions/ModelManager.component';
import PropertyTree from '../Functions/PropertyTree';
import Properties from '../Functions/Properties'; 
import SpatialStructure from '../Functions/SpatialStructure'
import Plans from '../Functions/Plans'
import Docker from '../Utility/DockerUtility'
import Settings from '../Utility/Settings'

import '../Functions/TransformControls'
import '../Functions/Culler' 

declare global {
    var debug: Function;

    var onModelAdded: CustomEvent<IFCModel>;
    var onModelRemoved: CustomEvent<IFCModel>;

    var onViewportLoaded: CustomEvent;

    var webIFC: IfcAPI;
}

const OnDebuggingEnabled = new CustomEvent('debugenabled');
const OnDebuggingDisabled = new CustomEvent('debugdisabled')
var isDebugging = false;

global.debug = () => {
    isDebugging = !isDebugging;

    isDebugging ? document.dispatchEvent(OnDebuggingEnabled) : document.dispatchEvent(OnDebuggingDisabled)
}

global.webIFC = new IfcAPI();
webIFC.SetWasmPath("https://unpkg.com/web-ifc@0.0.66/", true);
await webIFC.Init();

global.onViewportLoaded = new CustomEvent('onViewportLoaded');

const Viewport = styled('div')<{fullscreen: boolean, minimized: boolean}>(({theme, fullscreen, minimized})=>({
    display: minimized ? 'none' : 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    position: 'absolute',
    width: fullscreen ? '100%' : 'unset',
    height: fullscreen ? '100%' : 'unset',
    zIndex: '100',
    top: fullscreen ? '0 !important' : 'calc(50% - 200px)',
    left: fullscreen ? '0 !important' : 'calc(50% - 300px)',

    border: `0px solid ${theme.palette.accent.main}`,
    borderWidth: fullscreen ? '0px' : '2px',
    borderRadius: fullscreen ? '0px' : '5px',
}))

const ViewportMinimized = styled(BigButton)<{minimized: boolean}>(({minimized}) => ({
    display: minimized ? 'flex' : 'none',
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    padding: '10px 20px',
    width: 'unset', 
    borderRadius: '10px',
    cursor: 'pointer',
}));

const ViewportLabel = styled('div')<{fullscreen: boolean}>(({fullscreen, theme}) => ({
    position: 'relative',
    backgroundColor: theme.palette.primary.main,
    padding: '10px 5px',
    width: '100%',
    textAlign: 'center',
    borderRadius: fullscreen ? '0px' : '5px 5px 0px 0px',
    boxSizing: 'border-box',
    fontWeight: 'bold'
}))

const ViewportButtonContainer = styled('div')({
    position: 'absolute',
    right: '5px',
    top: '50%',
    transform: 'translateY(-50%)',
})

const ViewportButton = styled(IconButton, {target: 'material-symbols-outlined'})({
    backgroundColor: 'rgba(0, 0, 0, 0)', 
    border: 'unset !important',
    boxShadow: 'unset !important',
})

type ViewportContext = {
    fullscreen: boolean;
    minimized: boolean;
}

const ViewporContext = createContext<ViewportContext>({fullscreen: false, minimized: false});

export const viewportContext = () => useContext(ViewporContext);

export default function Viewer() {
    const viewportRef = useRef<HTMLDivElement>(undefined)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);

    var xOffset = 0;
    var yOffset = 0;

    const handleViewport = (e: MouseEvent<HTMLDivElement>) => {
        xOffset = viewportRef.current.offsetLeft - e.clientX;
        yOffset = viewportRef.current.offsetTop - e.clientY;

        document.addEventListener('mousemove', moveViewport);
        document.addEventListener('mouseup', ()=>{ 
            document.removeEventListener('mousemove', moveViewport)
        }, {once: true}) 
    }

    const moveViewport = (e: any) => {
        if(isFullscreen)
            return;

        viewportRef.current.style.top = `${yOffset + e.clientY}px`;
        viewportRef.current.style.left = `${xOffset + e.clientX}px`;
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    }

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        world.renderer.enabled = isMinimized;
    }

    const closeViewport = () => {

    }

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current= true;
            
            const debugFrame = culler.renderer.domElement;
            document.body.appendChild(debugFrame);
            debugFrame.style.visibility = 'hidden';
            debugFrame.style.position = "fixed";
            debugFrame.style.left = "0";
            debugFrame.style.bottom = "0";

            const stats = new Stats();
            stats.showPanel(2);
            document.body.append(stats.dom);
            stats.dom.style.visibility = 'hidden';
            stats.dom.style.zIndex = "unset";
            stats.dom.style.right = '0px';
            stats.dom.style.bottom = '0px';
            stats.dom.style.top = 'unset';
            stats.dom.style.left = 'unset';
            world.renderer.onBeforeUpdate.add(() => stats.begin());
            world.renderer.onAfterUpdate.add(() => stats.end());

            document.addEventListener('debugenabled', () => {
                debugFrame.style.visibility = 'visible';
                stats.dom.style.visibility = 'visible';
            })

            document.addEventListener('debugdisabled', () => {
                debugFrame.style.visibility = 'hidden';
                stats.dom.style.visibility = 'hidden';
            })
        }
    }, []) 

    return (     
        <ViewporContext.Provider value={{fullscreen: isFullscreen, minimized: false}}>
            <Viewport ref={viewportRef} id='viewport' fullscreen={isFullscreen} minimized={isMinimized}>
                <ViewportLabel className='unselectable' onMouseDown={handleViewport} fullscreen={isFullscreen}>
                    IFC Viewer
                    <ViewportButtonContainer>
                        <ViewportButton onClick={toggleMinimize}>minimize</ViewportButton>
                        <ViewportButton onClick={toggleFullscreen}>{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</ViewportButton>
                        <ViewportButton onClick={closeViewport}>close</ViewportButton>
                    </ViewportButtonContainer>
                </ViewportLabel>
                <Container/>
                <Docker isLeftDocker={false}/>
                <Docker isLeftDocker={true}/>
                <ToolBar/>
            </Viewport>
            <ViewportMinimized onClick={toggleMinimize} minimized={isMinimized}>IFC Viewer</ViewportMinimized>
            <NotificationsComponent/>
            <ModelManager/>
            <PropertyTree/>
            <Properties/>
            <SpatialStructure/>
            <Plans/>
            <Settings/>
        </ViewporContext.Provider>
    );
}