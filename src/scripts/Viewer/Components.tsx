import * as COM from '@thatopen/components'
import * as OBF from '@thatopen/components-front'
import * as THREE from 'three'
import {viewportContext} from './Viewer'
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


const input = new Map<string, number>(
    ['w', 's', 'd', 'a', 'e', 'q'].map(key => [key, 0]) 
);
var container: HTMLElement;

const Container = styled('div')<{fullscreen: boolean}>(({fullscreen}) => ({
    resize: fullscreen ? 'none' : 'both',
    overflow: 'hidden',
    minWidth: '300px',
    minHeight: '200px',
    width: fullscreen ? '100% !important' : '600px',
    height: fullscreen ? '100% !important' : '500px',
}))


export default function ContainerComponent() {
    const mounted = useRef(false);
    const context = viewportContext();

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            container = document.getElementById('container')
            InitializeComponents();
            InitializeCameraControls();

            document.dispatchEvent(global.onViewportLoaded) 
        }
    }, [])

    return <Container id='container' fullscreen={context.fullscreen}></Container>

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
            if(!container.matches(':hover'))
                return;
            
            if(input.has(e.key.toLowerCase())) {
                input.set(e.key.toLowerCase(), 1);
            }
        })
        
        document.addEventListener('keyup', e => {
            if (e.repeat)
                return;
            
            if(input.has(e.key.toLowerCase())) {
                input.set(e.key.toLowerCase(), 0);
            }
        })
    
        const cameraControls = world.camera.controls;
        const clock = new THREE.Clock();
        clock.start();
        setInterval(() => {
            const deltaTime = clock.getDelta();

            var direction = new THREE.Vector3(
                input.get('w') - input.get('s'), 
                input.get('d') - input.get('a'), 
                input.get('e') - input.get('q')
            );
            
            if (direction.length() == 0)
                return;

            direction.normalize();
            direction.multiplyScalar(deltaTime * 20);
        
            cameraControls.truck(direction.y, 0, true);
            cameraControls.elevate(direction.z, true)
            cameraControls.forward(direction.x, true);
        }, 10);
    }
}



