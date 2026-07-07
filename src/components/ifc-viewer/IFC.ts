import * as THREE from 'three'
import {FragmentsGroup} from '@thatopen/fragments'
import {boundingBoxer} from '../../components/ifc-viewer/Components'

export interface BoundingBoxData {
    outline: THREE.BoxHelper;
    boxMesh: THREE.Mesh;
}

export class IFCGroup extends THREE.Group {
    boundingBox: BoundingBoxData;
    ifcModels: IFCModel[] = [];

    recaculateBoundingBox = () => {
        var isVisible = false;
        if(this.boundingBox) {
            isVisible = this.boundingBox.outline.visible;
            this.remove(this.boundingBox.boxMesh);
            this.remove(this.boundingBox.outline)
        }
            
        boundingBoxer.dispose();
        boundingBoxer.reset();

        var max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
        var min = new THREE.Vector3(Infinity, Infinity, Infinity);

        this.ifcModels.forEach((ifcModel, i) => {    
            boundingBoxer.add(ifcModel);

            const mesh = boundingBoxer.getMesh();
            const box3 = boundingBoxer.get();
            
            const offset = ifcModel.position.clone().multiplyScalar(2);
            if(i != this.ifcModels.length - 1) {
                box3.min.sub(this.position);
                box3.max.sub(this.position)
                mesh.position.sub(this.position)
            }
            
            box3.max.add(mesh.position.clone()).add(offset);
            box3.min.add(mesh.position.clone()).add(offset);

            max.setX(max.x > box3.max.x ? max.x : box3.max.x);
            max.setY(max.y > box3.max.y ? max.y : box3.max.y);
            max.setZ(max.z > box3.max.z ? max.z : box3.max.z);

            min.setX(min.x < box3.min.x ? min.x : box3.min.x);
            min.setY(min.y < box3.min.y ? min.y : box3.min.y);
            min.setZ(min.z < box3.min.z ? min.z : box3.min.z);

            boundingBoxer.dispose();
            boundingBoxer.reset();
        })  

        const offset = min.clone().add(max).divideScalar(4);
        const boxGeometry = new THREE.BoxGeometry(max.x + -min.x, max.y + -min.y, max.z + -min.z);
        boxGeometry.computeBoundingBox();

        const meshMatrix = new THREE.Matrix4();
        meshMatrix.setPosition(offset);
        
        const mesh = new THREE.Mesh(boxGeometry);
        this.add(mesh);
        mesh.visible = false;
        mesh.applyMatrix4(meshMatrix)
        
        const outlineMesh = new THREE.Mesh(boxGeometry);
        const outlineMatrix = new THREE.Matrix4();

        outlineMatrix.setPosition(offset)
        outlineMesh.applyMatrix4(outlineMatrix);

        const outline = new THREE.BoxHelper(outlineMesh, 0xffffff);
        this.add(outline)   
        outline.visible = isVisible;
          
        this.boundingBox = {
            outline: outline,
            boxMesh: mesh
        };
    }
}

export class IFCDispatcher extends THREE.EventDispatcher<IFCModel> { 
    ifc: IFCModel;
}

export class IFCModel extends FragmentsGroup {
    onVisibilityChanged:{ isVisible: boolean }
    onPlans: {}
    onPropertyTree:{}
    onSpatialStructure:{}

    onModelMoveStart:{}
    onModelMove:{}
    onModelMoveEnd:{}
    onModelSelected:{}

    dispatcher: IFCDispatcher;
    ifcID: number;
    group: IFCGroup;
}