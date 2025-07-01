import * as FRA from '@thatopen/fragments'
import { world, fragmentManager, worlds } from '../Viewer/Components'
import {IconButton, WindowComponent, ToggleButton, FoldoutComponent, FoldoutElementComponent} from '../Utility/UIUtility.component';
import {IconButton, WindowComponent, ToggleButton, FoldoutComponent, FoldoutElementComponent} from '../Utility/UIUtility.component';
import { LoadIFCModel } from '../Viewer/IFCLoader' 
import {IFCGroup, IFCModel} from '../Viewer/IFC'
import { useRef, useState, FormEvent, useEffect, MouseEvent } from 'react';
import { JSX } from 'react/jsx-runtime';
import { styled, Stack, Tooltip } from '@mui/material'

const ModelManager = styled(WindowComponent)({
    alignContent: 'center',
    paddingLeft: '5px'
})

const ModelItem = styled('div')({
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '5px',
    borderRadius: '5px',
})

const ModelName = styled('div')({
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    alignContent: 'center',
    paddingLeft: '5px',
    marginRight: 'auto',
})

const ModelManagerComponent = () => {
    const rootRef = useRef<HTMLDivElement>(undefined);
    const containerRef = useRef<HTMLDivElement>(undefined);
    const [items, setItems] = useState<JSX.Element[]>([]);

    const addModel = (e:CustomEvent<IFCModel>) => {   
        groupStates.set(e.detail.group.uuid, [true]);
        e.detail.visible = e.detail.group.visible;
        e.detail.dispatcher.dispatchEvent({type: 'onVisibilityChanged', isVisible: e.detail.visible})

        setItems((oldItems)=>{
            var index = oldItems.findIndex((v) => v.props.group.uuid == e.detail.group.uuid)
        
            if(index != -1) {                    
                return oldItems.map((v, i) =>{
                    if(i != index)
                        return v;
                    else {
                        const children = v.props.children as any[];
                        const index = children.findIndex((v)=> v.props.ifcModel.ifcID == e.detail.ifcID)
                        
                        if(index == -1)
                            children.push( <ModelItemComponent ifcModel={e.detail}></ModelItemComponent> );
                        
                        return <ModelGroupComponent group={e.detail.group}>{children}</ModelGroupComponent>
                    }
                })
            } else {
                return [...oldItems, 
                    <ModelGroupComponent group={e.detail.group}>
                        {[<ModelItemComponent ifcModel={e.detail}></ModelItemComponent>]}
                    </ModelGroupComponent>
                ]
            }
        })
    }

    const removeModel = (e:CustomEvent<IFCModel>) => {
        if(e.detail.group.children.length == 3) {
            e.detail.group.clear();
            world.scene.three.remove(e.detail.group);
        } 

        const index = e.detail.group.ifcModels.findIndex((v)=>v.ifcID == e.detail.ifcID)
        if(index != -1) {
            e.detail.group.ifcModels.splice(index, 1)
        }
        e.detail.group.remove(e.detail);
        
        if(e.detail.group.ifcModels.length > 0)
            e.detail.group.recaculateBoundingBox();

        setItems((oldItems)=>{
            var index = oldItems.findIndex((v) => v.props.group.uuid == e.detail.group.uuid)

            if(!oldItems[index].props.children.length || oldItems[index].props.children.length == 1) {
                groupStates.delete(e.detail.group.uuid)
                return oldItems.filter((v, i) => i != index)
            } else {
                const children = oldItems[index].props.children;
                const newChildren = children.filter((value:any, index:number) => {
                    groupStates.get(e.detail.group.uuid).filter((v, i) => i != index) 
                    return value.props.ifcModel.ifcID != e.detail.ifcID.toString()
                })

                return oldItems.map((v, i) => {
                    if(i != index)
                        return v;
                    else {
                        return <ModelGroupComponent group={e.detail.group}>{newChildren}</ModelGroupComponent>;
                    }
                })
            }
        })
    }

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            document.addEventListener('onModelAdded', addModel)
            document.addEventListener('onModelRemoved', removeModel)
            
            document.getElementById('open-model-manager').addEventListener('click', ()=>{
                if(containerRef.current.parentElement == rootRef.current) 
                    rootRef.current.style.visibility = 'visible';
            })
        }
    }, [])
    
    return (
        <ModelManager label='Model Manager' root={rootRef} container={containerRef}>
            {
                items.length != 0 ?
                <Stack spacing={1}>
                    {items} 
                </Stack> 
                : <></>
            }
        </ModelManager>
    )
}

export default ModelManagerComponent;

const ModelItemComponent = (props: {ifcModel: IFCModel})=>{
    const ifcModel = props.ifcModel;
    const model = ifcModel;

    const [visible, setVisibilty] = useState(true);
    const [generalIFCData, setGeneralIFCData] = useState(undefined);
    const [generalIFCData, setGeneralIFCData] = useState(undefined);

    const openSpatialStructure = () => ifcModel.dispatcher.dispatchEvent({type: 'onSpatialStructure'})

    const openPropertyTree = ()=> ifcModel.dispatcher.dispatchEvent({type: 'onPropertyTree'}) 

    const toggleVisibility = (e:MouseEvent<HTMLElement>)=>{
        if(!props.ifcModel.group.visible)
            return;

        setVisibilty((oldValue) => !oldValue)
        const button = e.target as HTMLElement;
        button.innerHTML = !visible ? 'visibility' : 'visibility_off'; 

        props.ifcModel.visible = !visible;
        ifcModel.dispatcher.dispatchEvent({type: 'onVisibilityChanged', isVisible: !visible});
    }

    const openPlans = ()=> ifcModel.dispatcher.dispatchEvent({type: 'onPlans'}) 

    const deleteModel = ()=>{
        globalThis.onModelRemoved = new CustomEvent<IFCModel>('onModelRemoved', { detail: ifcModel });
        document.dispatchEvent(global.onModelRemoved);
        
        webIFC.CloseModel(ifcModel.ifcID);

        world.scene.three.remove(model)
        fragmentManager.disposeGroup(ifcModel);
        ifcModel.children.forEach(child=> {
            if(child instanceof FRA.FragmentMesh)
                world.meshes.delete(child);
        })

        model.dispose();
    }

    const getGeneralIFCData = async () => {
        const elements: any[] = [];
        
        const applicationDatas = await props.ifcModel.getAllPropertiesOfType(639542469);
        var applicationData: any;
        for(const id in applicationDatas) {
            applicationData = applicationDatas[id];
            break;
        }

        elements.push(
            <FoldoutComponent name='Application'>
                <FoldoutElementComponent label='Name' value={applicationData.ApplicationFullName.value}/>
                <FoldoutElementComponent label='Identifier' value={applicationData.ApplicationIdentifier.value}/>
                <FoldoutElementComponent label='Version' value={applicationData.Version.value}/>
            </FoldoutComponent>
        )

        const organizationElements: any[] = [];
        const organizationDatas = await props.ifcModel.getAllPropertiesOfType(4251960020);
        for(const id in organizationDatas) {
            const organizationData = organizationDatas[id];

            organizationElements.push(
                <FoldoutComponent name={organizationData.Name.value}>
                    <FoldoutElementComponent label='Description' value={organizationData.Description != null ? organizationData.Description.value : ''}/>
                </FoldoutComponent>
            )
        }
        
        elements.push(
            <FoldoutComponent name='Organizations'>
                {organizationElements}
            </FoldoutComponent>
        )

        const classificationElements: any[] = [];
        const classificationsData = await props.ifcModel.getAllPropertiesOfType(747523909);

        for(const id in classificationsData) {
            const classificationData = classificationsData[id] as any;
            classificationElements.push(
                <FoldoutComponent name={classificationData.Name.value}>
                    <FoldoutElementComponent label='Edition' value={classificationData.Edition.value}/>
                    <FoldoutElementComponent label='Source' value={classificationData.Source.value}/>
                </FoldoutComponent>
            )
        }

        elements.push(
            <FoldoutComponent name='Classifications'>
                {classificationElements}
            </FoldoutComponent>
        )
        
        setGeneralIFCData(elements);
    }

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            getGeneralIFCData();
        }
    }, [])

    return(
        <FoldoutComponent name={ifcModel.name} key={props.ifcModel.ifcID} header={
        <FoldoutComponent name={ifcModel.name} key={props.ifcModel.ifcID} header={
            <Stack sx={{alignItems: 'center'}} spacing={.5} direction={'row'}>
                <Tooltip title='Spatial Structure'>
                    <IconButton onClick={openSpatialStructure}>package_2</IconButton>
                </Tooltip>
                <Tooltip title='Floor Plans'>
                    <IconButton onClick={openPlans}>stacks</IconButton>
                </Tooltip>
                <Tooltip title='Property Tree'>
                    <IconButton onClick={openPropertyTree}>list</IconButton>
                </Tooltip>
                <Tooltip title='Visibility'>
                    <ToggleButton size='small' value={visible} selected={visible} color='primary' onChange={toggleVisibility}>visibility</ToggleButton>
                </Tooltip>
                <Tooltip title='Delete'>
                    <IconButton onClick={deleteModel}>delete</IconButton>
                </Tooltip>
            </Stack>
        }>  
            <FoldoutComponent name='General'>
                <FoldoutElementComponent label='Description' value={props.ifcModel.ifcMetadata.description}/>
                <FoldoutElementComponent label='Schema' value={props.ifcModel.ifcMetadata.schema}/>
            </FoldoutComponent>
            {generalIFCData}
        </FoldoutComponent>
    )
}

const groupStates = new Map<string, boolean[]>();

const ModelGroupComponent = (props: {children: JSX.Element|JSX.Element[], group: IFCGroup}) => {
    const [visible, setVisibilty] = useState(true);

    const addModelToGroup = (e: FormEvent<HTMLInputElement>, group:IFCGroup)=>{
        const file = e.currentTarget.files[0];
        if (!file)
            return;

        const reader = new FileReader();
        reader.onload = () => {
            groupStates.set(group.uuid, [...groupStates.get(group.uuid), true])
            
            const data = new Uint8Array(reader.result as ArrayBuffer);
            LoadIFCModel(data, file.name.split(".ifc")[0], false, group);
        }

        reader.readAsArrayBuffer(file);
    }


    const toggleVisibility = (e:MouseEvent<HTMLElement>)=>{
        setVisibilty((oldValue) => !oldValue)

        if(!visible) {
            const states = groupStates.get(props.group.uuid);
            props.group.ifcModels.forEach((ifcModel, i) => {
                ifcModel.visible = states[i];
                ifcModel.dispatcher.dispatchEvent({type: 'onVisibilityChanged', isVisible: true});
            })
        } else {
            groupStates.set(props.group.uuid, props.group.ifcModels.map(ifcModel => {
                return ifcModel.visible;
            }))

            props.group.ifcModels.forEach(ifcModel => {
                ifcModel.visible = false;
                ifcModel.dispatcher.dispatchEvent({type: 'onVisibilityChanged', isVisible: false});
            })
        }

        props.group.visible = !props.group.visible;
    }

    const focusGroup = () => {
        world.camera.controls.fitToBox(props.group.boundingBox.boxMesh, true, {paddingBottom: 5, paddingTop: 5, paddingLeft: 5, paddingRight: 5});   
    }

    return (
        <FoldoutComponent sx={{border: '1px solid', borderColor: 'secondary.light'}} name='New Group' inputLabel key={props.group.uuid} header={
                <Stack sx={{alignItems: 'center'}} spacing={.5} direction={'row'}>
                    <Tooltip title='Toggle Group Visibility'>
                        <ToggleButton value={visible} selected={visible} onClick={toggleVisibility}>
                            {visible ? 'visibility' : 'visibility_off'}
                        </ToggleButton>
                    </Tooltip>
                    <Tooltip title='Focus Group'>
                        <IconButton onClick={focusGroup}>
                            view_in_ar
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Add Model'>
                        <IconButton>
                            add
                            <label style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
                                <input type="file" onChange={(event)=>{addModelToGroup(event, props.group)}} accept=".ifc" hidden />
                            </label>
                        </IconButton>
                    </Tooltip>
                </Stack>
            }> 
                {props.children}
        </FoldoutComponent>
    )
}
