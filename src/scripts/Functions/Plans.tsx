import { plans, highlighter } from '../Viewer/Components'
import { DisableTool, EnableTool } from '../Viewer/Toolbar'
import { Notification } from '../Viewer/Notifications'
import { BigButton, WindowComponent } from '../Utility/UIUtility.component'
import { IFCDispatcher, IFCModel } from '../Viewer/IFC'
import { useState, useRef, useEffect } from 'react'
import { Stack } from '@mui/material'

var modelOpen: IFCModel;

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
        
        modelOpen = event.target.ifc;
        
        plans.list= [];
        try {
            await plans.generate(event.target.ifc);
        } catch {
            new Notification('No Plans Found', 'warning')
            return;
        }
        
        setPlans([]);
        const planViewButtons = plans.list.map(planView => {
            return (
                <BigButton onClick={() => { plans.goTo(planView.id) }}>{planView.name}</BigButton>
            )
        })

        DisableTool();
        highlighter.enabled = true;

        if(plansContainerRef.current.parentElement == plansRootRef.current) 
            plansRootRef.current.style.visibility = 'visible';
        
        setPlans(planViewButtons)
    }

    return (
        <WindowComponent label='Plans' root={plansRootRef} container={plansContainerRef} onClose={() => {
            highlighter.clear();
            highlighter.enabled = false;
            EnableTool();
            plans.exitPlanView(true)
        }}>
            {plansList.length != 0 ?
                <Stack spacing={.5}>
                    {plansList}
                </Stack>
                : <></>
            }
        </WindowComponent>
    )
}

