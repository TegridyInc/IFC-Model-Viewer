import { highlighter } from '../Components'
import { ModelFoldouts } from '../IFCUtility'
import { IFCModel }  from '@pim_platform/components/ifc-viewer/IFC'
import { Stack } from '@mui/material'
import Window from '@pim_platform/components/ifc-viewer/window/Window.component'
import { useRef, useState, useEffect } from 'react'

var ifcModels: IFCModel[] = [];

document.addEventListener('onModelAdded', (e:CustomEvent<IFCModel>)=>{
    ifcModels.push(e.detail)
})

export default function Properties() {
    const propertiesRootRef = useRef<HTMLDivElement>(undefined);
    const propertiesContainerRef = useRef<HTMLDivElement>(undefined);

    const [properties, setProperties] = useState([]);

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            const openProperties = document.getElementById('open-properties')
            openProperties.addEventListener('click', () => {
                if(propertiesContainerRef.current.parentElement == propertiesRootRef.current) {
                    propertiesRootRef.current.style.visibility = 'visible'
                }
            })
            
            highlighter.events.select.onHighlight.add(async (fragmentIDMap)=>{
                setProperties([])
            
                var idsFound = []
                for (const fragmentIDs in fragmentIDMap) {
                    var selectedIFCModel: IFCModel;
            
                    ifcModels.forEach((ifcModel) => {
                        ifcModel.children.forEach(child => {
                            if (child.uuid == fragmentIDs) {
                                selectedIFCModel = ifcModel;
                                return;
                            }
                        })
                    })
            
                    if (!selectedIFCModel)
                        continue;
            
                    for (const fragmentID of fragmentIDMap[fragmentIDs]) {
                        const value = idsFound.find(value => {
                            if (value.ifcModel.ifcID == selectedIFCModel.ifcID) {
                                if (value.fragmentID == fragmentID)
                                    return true;
                            }
                        })
            
                        if (value != undefined)
                            continue;
            
                        idsFound.push({ ifcModel: selectedIFCModel, fragmentID: fragmentID })
                    }        
                }

                const elements = await Promise.all(idsFound.map(async value => {
                    const property = await webIFC.properties.getItemProperties(value.ifcModel.ifcID, value.fragmentID);
                    
                    return (
                        <ModelFoldouts sx={{border: '1px solid', borderColor: 'secondary.light'}} ifcModel={value.ifcModel}  property={property}></ModelFoldouts>
                    )
                }))

                setProperties(elements)
            })

            highlighter.events.select.onClear.add(()=>{
                setProperties([])
            }) 
        }
    }, [])

    return (
        <Window label='Properties' root={propertiesRootRef} container={propertiesContainerRef}>
            {
                properties.length != 0 ?
                <Stack spacing={.5}>
                    {properties}
                </Stack>
                : <></>
            }
        </Window>
    );
}
