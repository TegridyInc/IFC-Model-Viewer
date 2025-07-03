import { DisableCustomView, EnableCustomView } from '../Viewer/Viewer'
import { plans, highlighter, classifier, edges, world, fragmentManager, grid } from '../Viewer/Components'
import { DisableTool, EnableTool } from '../Viewer/Toolbar'
import { Notification } from '../Viewer/Notifications'
import { BigButton, WindowComponent } from '../Utility/UIUtility.component'
import { IFCDispatcher, IFCModel } from '../Viewer/IFC'
import { useState, useRef, useEffect } from 'react'
import { Stack } from '@mui/material'
import * as THREE from 'three'

var modelOpen: IFCModel;

const grayFill = new THREE.MeshBasicMaterial({ color: "gray", side: 2 });
const blackLine = new THREE.LineBasicMaterial({ color: "black" });
const blackOutline = new THREE.MeshBasicMaterial({
  color: "black",
  opacity: 0.5,
  side: 2,
  transparent: true,
});

export default function Plans() {
    const [plansList, setPlans] = useState([]);

    const plansRootRef = useRef<HTMLDivElement>(undefined);
    const plansContainerRef = useRef<HTMLDivElement>(undefined);

    const mounted = useRef(false)
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;

            document.addEventListener('onModelAdded', (e: CustomEvent<IFCModel>) => {
                const ifcModel = e.detail;

                ifcModel.dispatcher.addEventListener('onPlans', OpenPlans)
            })

            document.addEventListener('onModelRemoved', (e: CustomEvent<IFCModel>) => {
                const ifcModel = e.detail;
                if (ifcModel == modelOpen) {
                    setPlans([])
                }

                ifcModel.dispatcher.removeEventListener('onPlans', OpenPlans)
            })
        }
    }, [])

    async function OpenPlans(event: { target: IFCDispatcher }) {
        if (event.target.ifc == modelOpen)
            return;

        if(plansContainerRef.current.parentElement == plansRootRef.current) 
            plansRootRef.current.style.visibility = 'visible';
        
        const ifcModel = event.target.ifc;

        plans.list = [];
        try {
            await plans.generate(ifcModel);
        } catch {
            new Notification('No Plans Found', 'warning')
            return;
        }
        
        if(plans.list.length == 0)
            return;
        
        setPlans([]);
        modelOpen = ifcModel;
        const planViewButtons = plans.list.map(planView => {
            return (
                <BigButton onClick={() => { plans.goTo(planView.id) }}>{planView.name}</BigButton>
            )
        })
        setPlans(planViewButtons);
        
        classifier.byModel(ifcModel.uuid, ifcModel);
        classifier.byEntity(ifcModel);
        
        const white = new THREE.Color(1,1,1);
        const modelItems = classifier.find({ models: [ifcModel.uuid] });
        classifier.setColor(modelItems, white)
        world.scene.three.background = white;
        highlighter.backupColor = white;
        
        const thickItems = classifier.find({
            entities: ["IFCWALLSTANDARDCASE", "IFCWALL", "IFCBUILDINGELEMENTPART", "IFCBUILDINGELEMENTPROXY"],
        });
        
        const thinItems = classifier.find({
            entities: ["IFCDOOR", "IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
        });
        
        edges.styles.create(
            "thick",
            new Set(),
            world,
            blackLine,
            grayFill,
            blackOutline,
        );

        
        for (const fragID in thickItems) {
            const foundFrag = fragmentManager.list.get(fragID);
            if (!foundFrag) continue;
            const { mesh } = foundFrag;
            
            if(!(mesh.geometry as any).boundsTree)
                continue;
            
            edges.styles.list.thick.fragments[fragID] = new Set(thickItems[fragID]);
            edges.styles.list.thick.meshes.add(mesh);
        }
        
        edges.styles.create("thin", new Set(), world);

        for (const fragID in thinItems) {
            const foundFrag = fragmentManager.list.get(fragID);
            if (!foundFrag) continue;
            const { mesh } = foundFrag;

            if(!(mesh.geometry as any).boundsTree)
                continue;

            edges.styles.list.thin.fragments[fragID] = new Set(thinItems[fragID]);
            edges.styles.list.thin.meshes.add(mesh);
        }
        
        await edges.update();
        
        DisableTool();
        highlighter.enabled = true;
        
        EnableCustomView('Plans');
        plans.goTo(plans.list[0].id);
    }

    async function ExitPlans() {
        highlighter.clear();
        highlighter.enabled = false;
        plans.exitPlanView(false)
        EnableTool();
        DisableCustomView();
        
        highlighter.backupColor = null;
        classifier.resetColor(modelOpen.getFragmentMap());
        world.scene.three.background = new THREE.Color(.05, .05, .05);
        
        modelOpen = null;
    }

    return (
        <WindowComponent label='Plans' root={plansRootRef} container={plansContainerRef} onClose={ExitPlans}>
            {plansList.length != 0 ?
                <Stack spacing={.5}>
                    {plansList}
                </Stack>
                : <></>
            }
        </WindowComponent>
    )
}

