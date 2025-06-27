import * as THREE from 'three'
import * as FRA from '@thatopen/fragments'
import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react'
import { highlighter, culler, fragmentHider } from '../Viewer/Components'
import { WindowComponent, FoldoutComponent, ToggleButton, ColorInput } from '../Utility/UIUtility.component'
import { ModelFoldouts } from '../Utility/IFCUtility'
import { IFCDispatcher, IFCModel } from '../Viewer/IFC'
import { Stack, Tooltip } from '@mui/material'
      
interface TypeData {
    data: { [attibute: string]: any }[];
    objects: Set<FRA.FragmentMesh>;
    fragmentIDMap: { [attribute: string]: any };
    type: number;
}

const typeState = new Map<number, Map<number, { isVisible: boolean, isHighlighted: boolean, highlightColor: THREE.Color }>>();

export default function PropertyTree() {
    const [ifcModel, setIFCModel] = useState<IFCModel>();

    const propertyTreeRoot = useRef<HTMLDivElement>(undefined);
    const propertyTreeContainer = useRef<HTMLDivElement>(undefined);

    const mounted = useRef(false);

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            document.addEventListener('onModelAdded', (e: CustomEvent<IFCModel>) => {
                e.detail.dispatcher.addEventListener('onPropertyTree', OpenPropertyTree)
            })

            document.addEventListener('onModelRemoved', (e: CustomEvent<IFCModel>) =>{
                setIFCModel(oldIFCModel => oldIFCModel == e.detail ? undefined : oldIFCModel)
                
                typeState.delete(e.detail.ifcID);
                e.detail.dispatcher.removeEventListener('onPropertyTree', OpenPropertyTree)
            })
        }
    }, []);

    return(
        <WindowComponent label='Property Tree' root={propertyTreeRoot} container={propertyTreeContainer} >
            <TypeFoldouts ifcModel={ifcModel}></TypeFoldouts>
        </WindowComponent>
    )

    function OpenPropertyTree(event: { target: IFCDispatcher}) {
        if(ifcModel == event.target.ifc) {
            return;
        }
    
        setIFCModel(event.target.ifc)

        if(propertyTreeContainer.current.parentElement == propertyTreeRoot.current) {
            propertyTreeRoot.current.style.visibility = 'visible';
        }
    }
} 

function TypeFoldouts(props: { ifcModel: IFCModel }) {
    const [items, setItems] = useState([]);

    const mounted = useRef(false);

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            document.addEventListener('onModelAdded', (e: CustomEvent<IFCModel>) => {
                typeState.set(e.detail.ifcID, new Map<number, { isVisible: boolean, isHighlighted: boolean, highlightColor: THREE.Color }>());
                e.detail.dispatcher.addEventListener('onPropertyTree', UpdateItems)
            })
        }
    }, []);

    if (!props.ifcModel)
        return <></>;

    async function UpdateItems(event: { target: IFCDispatcher}) {
        for (const selection in highlighter.selection) {
            if (selection != 'hover' && selection != 'select')
                highlighter.remove(selection)
        }
    
        setItems([])

        const ifcModel = event.target.ifc;

        var types: TypeData[] = [];
        var idsFound = new Set<number>();

        for (const child of ifcModel.children) {
            if (!(child instanceof FRA.FragmentMesh))
                continue;
        
            for (const id of child.fragment.ids) { 
                const properties = await webIFC.properties.getItemProperties(ifcModel.ifcID, id);
                const index = types.findIndex(value => value.type == properties.type)
    
                if(index == -1) {
                    types.push({ data: [properties], objects: new Set<FRA.FragmentMesh>([child]), fragmentIDMap: null, type: properties.type });
                    if(typeState.get(ifcModel.ifcID).get(properties.type) == undefined) 
                        typeState.get(ifcModel.ifcID).set(properties.type, { isVisible: true, isHighlighted: false, highlightColor: new THREE.Color(1, 0, 0) });
                } else {
                    if(!idsFound.has(id)) {
                        types[index].data.push(properties)
                    }
                    types[index].objects.add(child)
                } 
    
                idsFound.add(id)
            }
        }

        types.forEach(type => {
            var fragmentIds: number[] = [];
            type.objects.forEach(object => {
                const ids = [...object.fragment.ids.values()];
                fragmentIds.push(...ids)
            })

            type.fragmentIDMap = ifcModel.getFragmentMap(fragmentIds)
        })

        setItems(types.map(value => {
            return <TypeFoldout typeData={value} ifcModel={ifcModel}></TypeFoldout>;
        }))
    }

    return (
        <Stack spacing={1}>
            {items}
        </Stack>
    )
}

const TypeFoldout = (props: {typeData: TypeData, ifcModel: IFCModel}) => {
    const [highlighted, setHighlight] = useState(typeState.get(props.ifcModel.ifcID).get(props.typeData.type).isHighlighted);
    const [visible, setVisibilty] = useState(typeState.get(props.ifcModel.ifcID).get(props.typeData.type).isVisible);
    const [highlightColor, setHighlightColor] = useState( typeState.get(props.ifcModel.ifcID).get(props.typeData.type).highlightColor);
    const [isOpen, setOpenState] = useState(false);

    const name = webIFC.GetNameFromTypeCode(props.typeData.type);
    const mounted = useRef(false)
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            highlighter.add(name, new THREE.Color(1, 0, 0))
        }
    },[])

    const objectsProperties = props.typeData.data.map(value => {
        return(
            <ModelFoldouts property={value} ifcModel={props.ifcModel} key={value.Name.value}></ModelFoldouts>
        );
    });

    const changeHighlightColor = (e: ChangeEvent<HTMLInputElement>)=>{
        const value = (e.target as HTMLInputElement).value;
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        const rgb = {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        };
        const color = highlighter.colors.get(name);
        if (color)
            color.set(rgb.r, rgb.g, rgb.b);

        setHighlightColor(color);
        typeState.get(props.ifcModel.ifcID).set(props.typeData.type, { isVisible: visible, isHighlighted: highlighted, highlightColor: color });
    }

    const toggleHighlight = (e:MouseEvent<HTMLElement>)=>{
        setHighlight((oldValue)=>{
            typeState.get(props.ifcModel.ifcID).set(props.typeData.type, { isVisible: visible, isHighlighted: !oldValue, highlightColor: highlightColor });
            return !oldValue
        });

        highlighter.highlightByID(name, highlighted ? {} : props.typeData.fragmentIDMap, true)
    }

    const toggleVisibility = (e:MouseEvent<HTMLElement>)=>{
        if(!props.ifcModel.visible)
            return;
        
        setVisibilty((oldValue)=>{
            typeState.get(props.ifcModel.ifcID).set(props.typeData.type, { isVisible: !oldValue, isHighlighted: highlighted, highlightColor: highlightColor });
            return !oldValue
        });

        for (const threeObject of props.typeData.objects) {
            const colorMesh = culler.colorMeshes.get(threeObject.uuid);
            if (!colorMesh) {
                threeObject.visible = !visible;
                continue;
            }

            if (visible)
                colorMesh.visible = false;
            else
                colorMesh.visible = true;
        }

        fragmentHider.set(!visible, props.typeData.fragmentIDMap);

        culler.needsUpdate = true;
    }

    return (
        <FoldoutComponent sx={{border: '1px solid', borderColor: 'secondary.light'}} onClosed={async ()=> {setOpenState(false)}} onOpen={async ()=> {setOpenState(true)}} key={name} name={name} header={
            <Stack sx={{marginLeft: 'auto', alignItems: 'center', marginRight: '5px'}} spacing={.5} direction={'row'}>
                <Tooltip title='Highlight Color'>
                    <ColorInput type="color" className='color-input' defaultValue={'#'+highlightColor.getHexString()} onChange={changeHighlightColor}/>
                </Tooltip>
                <Tooltip title='Highlight'>
                    <ToggleButton value={highlighted} selected={highlighted} onClick={toggleHighlight}>{highlighted ? 'lightbulb' : 'light_off'}</ToggleButton>
                </Tooltip>
                <Tooltip title='Visibility'>
                    <ToggleButton value={visible} selected={visible} onClick={toggleVisibility}>{visible ? 'visibility' : 'visibility_off'}</ToggleButton>
                </Tooltip>
            </Stack>
        }>
            {isOpen ? objectsProperties : <></>}
        </FoldoutComponent>
    )
}



