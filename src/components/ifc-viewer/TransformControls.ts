import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { toolEnabled, Tools } from './Toolbar'
import { caster, world } from './Components'
import {IFCGroup, IFCModel} from './IFC'

const modelGroups = new Set<IFCGroup>([]);

var controls: TransformControls;
var selectedGroup: IFCGroup;
var mouseMoveAmount = new THREE.Vector2(0, 0);
var moveToolEnabled = false;

document.addEventListener('onViewportLoaded', ()=>{
    const container = document.getElementById('container');
    controls = new TransformControls(world.camera.three, world.renderer.three.domElement); 
    controls.setMode('translate');
    world.scene.three.add(controls as any);
    
    controls.addEventListener('mouseDown', () => {
        world.camera.controls.enabled = false;
    })

    controls.addEventListener('mouseUp', () => {
        world.camera.controls.enabled = true;

        if(!selectedGroup)
            return;
        
        selectedGroup.ifcModels.forEach(ifcModel => {
            ifcModel.updateWorldMatrix(false, true)
            ifcModel.dispatcher.dispatchEvent({type: 'onModelMoveEnd'})
        })
    })

    container.addEventListener('mousedown', ()=> {
        if(!toolEnabled || !moveToolEnabled)
            return;

        const addMouseMovement = (e: MouseEvent) => {
            mouseMoveAmount.x += e.movementX;
            mouseMoveAmount.y += e.movementY;
        }

        mouseMoveAmount.set(0, 0);
        document.addEventListener('mousemove', addMouseMovement);
      
        const groups = [...modelGroups];

        const result = caster.castRay(groups.map(group => group.boundingBox.boxMesh));
        
        document.addEventListener('mouseup', ()=>{
            document.removeEventListener('mousemove', addMouseMovement);
            if(!result && mouseMoveAmount.length() < 5) {
                controls.detach();
                ClearSelection();
                return;
            }
        }, {once: true});

        if(!result || !result.object)
            return;

        ClearSelection();
        selectedGroup = groups.find(group => group.boundingBox.boxMesh.uuid == result.object.uuid);
        selectedGroup.boundingBox.outline.visible = true;

        controls.attach(result.object.parent);   
    })

    document.addEventListener('keyup', (e) => {
        if(e.key == 'f' && container.matches(':hover') && selectedGroup) {
            world.camera.controls.fitToBox(selectedGroup.boundingBox.boxMesh, true, {paddingBottom: 5, paddingTop: 5, paddingLeft: 5, paddingRight: 5});
        }
    })
})

document.addEventListener('onModelAdded', (e: CustomEvent<IFCModel>) => {
    const ifcModel = e.detail;
    modelGroups.add(ifcModel.group);
})

document.addEventListener('onModelRemoved', (e:CustomEvent<IFCModel>)=>{
    const ifcModel = e.detail;
    const ifcGroup = ifcModel.group;
    
    if(ifcGroup.ifcModels.length == 1) {
        modelGroups.delete(ifcGroup);
        if(ifcGroup == selectedGroup)
            ClearSelection();
    }
})

document.addEventListener('onToolChanged', (e: CustomEvent) => {
    const tool = e.detail as Tools;

    if (tool != Tools.Move) {
        ClearSelection();
        controls.detach();
        moveToolEnabled = false;
    } else {
        moveToolEnabled = true;
    }
})

function ClearSelection() {
    if(selectedGroup) 
        selectedGroup.boundingBox.outline.visible = false;

    selectedGroup = null;
}