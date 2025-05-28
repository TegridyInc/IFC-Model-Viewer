import * as Stats from 'stats.js';
import { IfcAPI } from 'web-ifc'

import { styled } from '@mui/material'
import { useRef, MouseEvent, useEffect } from 'react';

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

const Viewport = styled('div')({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    position: 'absolute',
    zIndex: '100',
    top: 'calc(50% - 200px)',
    left: 'calc(50% - 300px)',

    border: '2px solid var(--accent-color)',
    borderRadius: '5px',
})

const ViewportLabel = styled('div')({
    backgroundColor: 'var(--secondary-color)',
    padding: '10px 5px',
    width: '100%',
    textAlign: 'center',
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontWeight: 'bold'
})

export default function Viewer() {
    const viewportRef = useRef<HTMLDivElement>(undefined)

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
        viewportRef.current.style.top = `${yOffset + e.clientY}px`;
        viewportRef.current.style.left = `${xOffset + e.clientX}px`;
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
        <>
            <Viewport ref={viewportRef} id='viewport'>
                <ViewportLabel className='unselectable' onMouseDown={handleViewport}>IFC Viewer</ViewportLabel>
                <Container/>
                <Docker isLeftDocker={false}/>
                <Docker isLeftDocker={true}/>
                <ToolBar/>
            </Viewport>
            <NotificationsComponent/>
            <ModelManager/>
            <PropertyTree/>
            <Properties/>
            <SpatialStructure/>
            <Plans/>
            <Settings/>
        </>
    );
}