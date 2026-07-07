import { useState, useRef, useEffect } from 'react';
import Window from '@pim_platform/components/ifc-viewer/window/Window.component'
import Foldout from '../foldout/Foldout.component'
import FoldoutElement from '../foldout/FoldoutElement.component';

import {IFCDispatcher, IFCModel } from '../IFC'

var openModel: IFCModel;

const SpatialStructureElement = (props: {element: any}) => {
    const [isOpen, setIsOpen] = useState(false);

    if (props.element.children.length > 0) {
        const children = props.element.children as any[];
        const elements = children.map(child => {
            return <SpatialStructureElement element={child}></SpatialStructureElement>
        })

        return (
            <Foldout 
                label={props.element.type} 
                header={ <div style={{paddingLeft: '5px'}}>{props.element.Name ? props.element.Name.value : ''}</div>} 
                onOpen={async () => { setIsOpen(true) }} 
                onClosed={async () => { setIsOpen(false) }}
            >
                {isOpen ? elements : <></>}
            </Foldout>
        )
    } else {
        return <FoldoutElement label={props.element.Name.value + ` (${props.element.type})`}/>
    }
}

export default function SpatialStructure() {
    const rootRef = useRef<HTMLDivElement>(undefined);
    const containerRef = useRef<HTMLDivElement>(undefined);
    const [spatialStructure, setSpatialStructure] = useState(undefined);

    const getSpatialStructure = async (event: {target: IFCDispatcher}) => {
        if(containerRef.current.parentElement == rootRef.current) 
            rootRef.current.style.visibility = 'visible';

        if(openModel == event.target.ifc)
            return;
        
        const id = event.target.ifc.ifcID;
        openModel = event.target.ifc;
    
        const spatialStructure = await webIFC.properties.getSpatialStructure(id, true);
        const ifcProject = await webIFC.properties.getItemProperties(id, spatialStructure.expressID);
    
        const elements = spatialStructure.children.map(child => {
            return <SpatialStructureElement element={child}></SpatialStructureElement>
        })

        setSpatialStructure(
            <Foldout sx={{border: '1px solid', borderColor: 'secondary.light'}} label={spatialStructure.type} header={<div style={{paddingLeft: '5px'}}>{ifcProject.Name.value}</div>}>
                {elements}
            </Foldout>
        )
    }

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            document.addEventListener('onModelAdded', (e:CustomEvent<IFCModel>) => e.detail.dispatcher.addEventListener('onSpatialStructure', getSpatialStructure))
        }
    }, [])

    return (
        <Window label='Spatial Structure' root={rootRef} container={containerRef}>
            {spatialStructure}
        </Window>
    )
}