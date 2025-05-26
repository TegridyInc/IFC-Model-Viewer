import * as THREE from 'three'
import { toolEnabled, Tools } from '../Viewer/Toolbar'
import { caster, world } from '../Viewer/Components'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import {IFCGroup, IFCModel} from '../Viewer/IFC'

const modelGroups = new Set<IFCGroup>([]);
const fbxLoader = new FBXLoader();

var selectedGroup: IFCGroup;
var transformControls: THREE.Group;
var upControl: THREE.Mesh;
var leftControl: THREE.Mesh;
var forwardControl: THREE.Mesh;

var mouseMoveAmount = 0;
var moveToolEnabled = false;

document.addEventListener('onViewportLoaded', ()=>{
    const container = document.getElementById('container');
     
    //Transform Controls
    container.addEventListener('mousedown', () => {
        mouseMoveAmount = 0;
        document.addEventListener('mousemove', CalculateMouseMoveAmount)

        if(!selectedGroup)
            return;

        const result = caster.castRay([upControl, leftControl, forwardControl]);
        if (!result)
            return;

        world.camera.controls.enabled = false;
        var axis = new THREE.Vector3();
        if (result.object == upControl)
            axis.set(0, 1, 0);
        else if (result.object == leftControl)
            axis.set(1, 0, 0)
        else
            axis.set(0, 0, 1)

        selectedGroup.ifcModels.forEach(ifcModel => {
            ifcModel.dispatcher.dispatchEvent({type: 'onModelMoveStart'})
        })

        document.addEventListener('mousemove', MoveModel)

        document.addEventListener('mouseup', () => {
            world.camera.controls.enabled = true;
            document.removeEventListener('mousemove', MoveModel)

            if (!selectedGroup)
                return;

            selectedGroup.ifcModels.forEach(ifcModel => {
                ifcModel.updateWorldMatrix(false, true)
                ifcModel.dispatcher.dispatchEvent({type: 'onModelMoveEnd'})
            })
        }, { once: true })

        function MoveModel(e: MouseEvent) {
            var forward = new THREE.Vector3();
            world.camera.three.getWorldDirection(forward)

            const yaw = world.camera.three.rotation.z;

            const left = new THREE.Vector3();
            left.x = -Math.cos(yaw);
            left.y = 0;
            left.z = Math.sin(yaw);

            const up = forward.clone().cross(left);

            const distance = world.camera.projection.current == 'Perspective' ? result.distance : (45 / world.camera.threeOrtho.zoom);
            const mouseMovement = new THREE.Vector2(e.movementX * .002 * distance, e.movementY * .002 * distance);

            const offsetX = left.x * -mouseMovement.x + (up.x * -mouseMovement.y * (forward.y > 0 ? -1 : 1));
            const offsetY = Math.abs(up.y) * -mouseMovement.y;
            const offsetZ = up.z * -mouseMovement.y + (left.z * -mouseMovement.x * (forward.y > 0 ? -1 : 1));
            const offset = axis.clone().multiply(new THREE.Vector3(offsetX, offsetY, offsetZ))
            transformControls.position.add(offset)

            selectedGroup?.position.copy(transformControls.position);
            selectedGroup.ifcModels.forEach(ifcModel => {
                ifcModel?.dispatcher.dispatchEvent({type: 'onModelMove'})
            })
        }
    })

    //Bounding Boxes
    container.addEventListener('mouseup', (e) => {
        document.removeEventListener('mousemove', CalculateMouseMoveAmount)

        if (e.button != 0 || mouseMoveAmount != 0 || !toolEnabled)
            return;

        if (moveToolEnabled) {
            ClearSelection();

            const geometries = [] as THREE.Mesh[]
            modelGroups.forEach(group => {
                geometries.push(group.boundingBox.boxMesh);
            })

            const result = caster.castRay(geometries);
            if (!result)
                return;

            var modelGroup: IFCGroup;
            modelGroups.forEach(group => {
                if(group.boundingBox.boxMesh == result.object) {
                    modelGroup = group;
                    return;
                }
            })

            const outline = modelGroup.boundingBox.outline;
            outline.visible = true;

            transformControls.visible = true;
            transformControls.position.copy(outline.parent.position);
            selectedGroup = modelGroup;
        }
    })

    fbxLoader.load('./Assets/Transform Controls.fbx', (model) => {
        model.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            if (mesh) {
                const material = mesh.material as THREE.MeshPhongMaterial;
                mesh.material = new THREE.MeshBasicMaterial({ depthFunc: THREE.AlwaysDepth, color: material.color });
            }
    
            if (mesh.name == 'UP')
                upControl = mesh;
            else if (mesh.name == 'LEFT')
                leftControl = mesh;
            else if (mesh.name == 'FORWARD')
                forwardControl = mesh;
        })
    
        world.scene.three.add(model)
        model.visible = false;
        transformControls = model;
    });

    document.addEventListener('keyup', (e) => {
        if(e.key == 'f' && container.matches(':hover') && selectedGroup) {
            world.camera.controls.fitToBox(selectedGroup.boundingBox.boxMesh, true, {paddingBottom: 5, paddingTop: 5, paddingLeft: 5, paddingRight: 5});
        }
    })

    world.camera.controls.addEventListener('control', ScaleTransformControls)
    world.camera.controls.addEventListener('controlend', ScaleTransformControls)
})

document.addEventListener('onModelAdded', (e: CustomEvent<IFCModel>) => {
    const ifcModel = e.detail;
    modelGroups.add(ifcModel.group)
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
        transformControls.visible = false;
        moveToolEnabled = false;
    } else {
        moveToolEnabled = true;
    }
})

function CalculateMouseMoveAmount(e: MouseEvent) {
    mouseMoveAmount += e.movementX;
    mouseMoveAmount += e.movementY;
}


function ScaleTransformControls() {
    if (world.camera.projection.current == 'Orthographic') {
        transformControls.scale.setScalar(45 / world.camera.threeOrtho.zoom);
    } else {
        var distance = transformControls.position.distanceTo(world.camera.three.position);
        transformControls.scale.setScalar(distance + 2);
    }
}

function ClearSelection() {
    if(selectedGroup) 
        selectedGroup.boundingBox.outline.visible = false;

    selectedGroup = null;
    transformControls.visible = false;
}