import * as FRA from '@thatopen/fragments'
import { world, culler, fragmentHider } from '../Viewer/Components'
import {IFCDispatcher, IFCModel} from '../Viewer/IFC'

type MeshState = Map<number, boolean>;
const meshStates = new Map<string, MeshState>();

document.addEventListener('onViewportLoaded', ()=>{
    world.camera.controls.addEventListener("sleep", () => {
        culler.needsUpdate = true;
    });
})

document.addEventListener('onModelAdded', (e:CustomEvent<IFCModel>)=>{
    const ifcModel = e.detail;

    ifcModel.children.forEach(child =>{
        if(child instanceof FRA.FragmentMesh) 
            culler.add(child);
    })
    culler.needsUpdate = true;
    
    ifcModel.dispatcher.addEventListener('onModelMoveEnd', UpdateColorMeshPosition)
    ifcModel.dispatcher.addEventListener('onVisibilityChanged', UpdateColorMeshVisibility)
})

function UpdateColorMeshVisibility(event: {target: IFCDispatcher}) {
    const model = event.target.ifc;

    var meshState: MeshState;
    if(meshStates.has(model.uuid)) 
        meshState = meshStates.get(model.uuid)
    else {
        meshState = new Map<number, boolean>();
        meshStates.set(model.uuid, meshState);
    }

    if(!model.visible) {
        model.children.forEach((child, i) => {
            if(child instanceof FRA.FragmentMesh) {
                const colorMesh = culler.colorMeshes.get(child.uuid);
                if (colorMesh != undefined) 
                    meshState.set(i, colorMesh.visible);
                else 
                    meshState.set(i, child.visible);
            } 
        })
        
        fragmentHider.set(false, model.getFragmentMap());
    } else {
        fragmentHider.set(true, model.getFragmentMap());

        var ids: number[] = [];
        model.children.forEach((child, i) => {
            if(child instanceof FRA.FragmentMesh) {
                if(!meshState.get(i)) {
                    ids.push(...child.fragment.ids);
                }
            } 
        })
        fragmentHider.set(false, model.getFragmentMap(ids));
    }
    
    culler.needsUpdate = true;
}

function UpdateColorMeshPosition(event: {target: IFCDispatcher}) {
    const model = event.target.ifc;

    for (const child of model.children) {
        const colorMesh = culler.colorMeshes.get(child.uuid)
         
        if (colorMesh != undefined) {
            colorMesh.position.setScalar(0);

            colorMesh.applyMatrix4(child.matrixWorld)
            colorMesh.updateMatrix();
        }
    }

    culler.needsUpdate = true;
}

document.addEventListener('onModelRemoved', (e:CustomEvent<IFCModel>)=>{
    const ifcModel = e.detail;

    ifcModel.children.forEach(child=>{
        if(child instanceof FRA.FragmentMesh) 
            culler.remove(child);
    })

    ifcModel.dispatcher.removeEventListener('onModelMoveEnd', UpdateColorMeshPosition);
    ifcModel.dispatcher.removeEventListener('onVisibilityChanged', UpdateColorMeshVisibility)
})

