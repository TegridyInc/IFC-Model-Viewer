import * as COM from '@thatopen/components'
import * as OBF from '@thatopen/components-front'
import * as THREE from 'three'
import { useRef, useEffect } from 'react';
import { styled } from '@mui/material';

const components = new COM.Components();
export const exporter = components.get(COM.IfcJsonExporter);
export const ifcloader = components.get(COM.IfcLoader);
export const worlds = components.get(COM.Worlds);
export const world = worlds.create<COM.SimpleScene, COM.OrthoPerspectiveCamera, OBF.PostproductionRenderer>();
export const fragmentManager = components.get(COM.FragmentsManager);
export const fragmentHider = components.get(COM.Hider);
export const clipper = components.get(COM.Clipper);
export const cullers = components.get(COM.Cullers);
export const boundingBoxer = components.get(COM.BoundingBoxer);
export const casters = components.get(COM.Raycasters);
export const grids = components.get(COM.Grids);
export const propsManager = components.get(COM.IfcPropertiesManager);
export const highlighter = components.get(OBF.Highlighter);
export const plans = components.get(OBF.Plans);
export const indexer = components.get(COM.IfcRelationsIndexer)
export const exploder = components.get(COM.Exploder);
export const classifier = components.get(COM.Classifier);

export var postproduction: OBF.Postproduction;
export var ambientOclussion: any;
export var grid: COM.SimpleGrid;
export var caster: COM.SimpleRaycaster;
export var culler: COM.MeshCullerRenderer;

var container: HTMLElement;
var cameraInput = new THREE.Vector3;

const Container = styled('div')({
    resize: 'both',
    overflow: 'hidden',
    minWidth: '300px',
    minHeight: '200px',
    width: '600px',
    height: '500px',
})

export default function ContainerComponent() {
    const mounted = useRef(false);

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            container = document.getElementById('container')
            InitializeComponents();
            InitializeCameraControls();

            document.dispatchEvent(global.onViewportLoaded) 
        }
    }, [])

    return <Container id='container'></Container>

    function InitializeComponents() {
        components.init();
    
        world.scene = new COM.SimpleScene(components);
        world.renderer = new OBF.PostproductionRenderer(components, container);
        world.camera = new COM.OrthoPerspectiveCamera(components);
        world.camera.controls.maxDistance = Infinity;
        world.camera.three.far = 10000;

        world.scene.setup({ backgroundColor: new THREE.Color(.05, .05, .05) });
        
        highlighter.setup({ world });
        grid = grids.create(world);
        grid.config.distance = 1000;
        caster = casters.get(world);
        
        clipper.enabled = false;
        clipper.setup({ color: new THREE.Color(1, 0, 0), size: 10 })
    
        culler = cullers.create(world);
        culler.config.threshold = 0;
        culler.needsUpdate = true;
    
        culler.config.renderDebugFrame = true;
        culler.config.width = 350;
        culler.config.height = 350;
    
        plans.world = world;
    
        ifcloader.setup();
    
        postproduction = world.renderer.postproduction;
        postproduction.enabled = true;
        postproduction.customEffects.excludedMeshes.push(grid.three);
        postproduction.setPasses({gamma: false});
        postproduction.setPasses({custom: false});
        
        ambientOclussion = postproduction.n8ao.configuration;

        document.addEventListener('dblclick', () => {
            if (!clipper.enabled)
                return;
            clipper.create(world);
        })
        
        world.renderer.onResize.add(() => {
            world.camera.updateAspect();
            world.renderer.three.render(world.scene.three, world.camera.three)
        })
    }
    
    function InitializeCameraControls() {
        document.addEventListener('keydown', e => {
            if (e.repeat)
                return;
            const key = e.key.toLowerCase();
        
            if ((key == 'w' && cameraInput.x != 1) || (key == 's' && cameraInput.x != -1))
                cameraInput.add(new THREE.Vector3(Number(key == 'w') + -Number(key == 's'), 0, 0))
        
            if ((key == 'd' && cameraInput.y != 1) || (key == 'a' && cameraInput.y != -1))
                cameraInput.add(new THREE.Vector3(0, Number(key == 'd') + -Number(key == 'a'), 0))
        
            if ((key == ' ' && cameraInput.z != 1) || (key == 'shift' && cameraInput.z != -1))
                cameraInput.add(new THREE.Vector3(0, 0, Number(key == ' ') + -Number(key == 'shift')))
        })
        
        document.addEventListener('keyup', e => {
            if (e.repeat)
                return;
            const key = e.key.toLowerCase();
        
            cameraInput.sub(new THREE.Vector3(Number(key == 'w') + -Number(key == 's'), Number(key == 'd') + -Number(key == 'a'), Number(key == ' ') + -Number(key == 'shift')))
        })
    
        const cameraControls = world.camera.controls;
        const clock = new THREE.Clock();
        clock.start();
        setInterval(() => {
            const deltaTime = clock.getDelta();
        
            if (cameraInput.length() == 0)
                return;
        
            const input = cameraInput.clone().multiplyScalar(deltaTime * 10);
            cameraControls.truck(input.y, 0, true);
            cameraControls.elevate(input.z, true)
            cameraControls.forward(input.x, true);
        }, 10);
    }
}



