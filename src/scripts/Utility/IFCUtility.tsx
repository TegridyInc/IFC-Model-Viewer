import { useState, useRef, useEffect } from 'react';
import { FoldoutComponent, FoldoutElementComponent } from './UIUtility.component';
import { IFCModel } from '../Viewer/IFC'
import { JSX } from 'react/jsx-runtime';
import { SxProps } from '@mui/material';

export function ModelFoldouts(props: {sx?:SxProps, property: { [attribute: string]: any }, ifcModel: IFCModel}) {
    const [isOpen, setIsOpen] = useState(false);

    const foldouts = [
        <AttributesFoldout ifcModel={props.ifcModel} property={props.property}></AttributesFoldout>,
        <MaterialFoldout ifcModel={props.ifcModel} property={props.property}></MaterialFoldout>,
        <ClassificationsFoldout ifcModel={props.ifcModel} property={props.property}/>,
        <PropertySetsFoldout ifcModel={props.ifcModel} property={props.property}></PropertySetsFoldout>,
        <SpatialElementFoldout ifcModel={props.ifcModel} property={props.property}></SpatialElementFoldout>,
    ]

    return (
        <FoldoutComponent sx={props.sx} name={props.property.Name.value} onOpen={() => { setIsOpen(true) }} onClosed={() => { setIsOpen(false) }}>
            {isOpen ? foldouts : <></>}
        </FoldoutComponent>
    )
}

function AttributesFoldout(props: { ifcModel:IFCModel, property: { [attribute: string]: any } }) {
    const [attributes, setAttributes] = useState(undefined);
    const [isOpen, setIsOpen] = useState(false);

    const getAttributes = async () =>{
        setAttributes(
            [
                <FoldoutElementComponent label='Class' value={webIFC.GetNameFromTypeCode(props.property.type)}></FoldoutElementComponent>,
                (props.property.ObjectType ? <FoldoutElementComponent label='Object Type' value={props.property.ObjectType.value}></FoldoutElementComponent> : <></>)
            ]
        )
    }

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            getAttributes();
        }
    }, []);
    
    return (
        <FoldoutComponent name='Attributes' onOpen={()=>{setIsOpen(true)}} onClosed={()=>{setIsOpen(false)}}>
            {!isOpen ? <></> :
                attributes
            }
        </FoldoutComponent>
    )
}


function MaterialFoldout(props: { ifcModel:IFCModel, property: { [attribute: string]: any } }) {
    const [materials, setMaterials] = useState(undefined);
    const [isOpen, setIsOpen] = useState(false);

    const mounted = useRef(false);
    const foldoutName = useRef('Materials');
    
    const getMaterials = async () =>{
        const id = props.ifcModel.ifcID;
        const materialsProperty = await webIFC.properties.getMaterialsProperties(id, props.property.expressID);
    
        var elements: JSX.Element | JSX.Element[];

        if(!materialsProperty[0]) 
            return;

        const materialProperty = materialsProperty[0];
        if(materialProperty.ForLayerSet || materialProperty.MaterialLayers) {
            var layerSet;
            if (materialProperty.ForLayerSet)
                layerSet = await webIFC.properties.getItemProperties(id, materialProperty.ForLayerSet.value);
            else
                layerSet = materialProperty

            const materialsLayers = layerSet.MaterialLayers as any[];
            
            elements = await Promise.all(materialsLayers.map(async materialLayer => {
                const layer = await webIFC.properties.getItemProperties(id, materialLayer.value);
                var material: any;

                if(layer.Material) {
                    material = await webIFC.properties.getItemProperties(id, layer.Material.value);
                }

                foldoutName.current = 'Layers';

                return (
                    <FoldoutComponent name='Layer'>
                        {material ? <FoldoutElementComponent label='Material' value={material.Name.value}/> : <FoldoutElementComponent label='Material' value='Undefined'/>}
                        {layer.LayerThickness ? <FoldoutElementComponent label='Layer Thickness' value={layer.LayerThickness.value}/> : <></>}
                    </FoldoutComponent>
                )
            }))
            
            foldoutName.current = 'Layers';
        } else if (materialProperty.Materials) {
            const materialsProperty = materialProperty.Materials as any[];
            elements = await Promise.all(materialsProperty.map(async materialProperty => {
                const material = await webIFC.properties.getItemProperties(id, materialProperty.value);
                return <FoldoutElementComponent label={material.Name.value}></FoldoutElementComponent>;
            }));
        } else {
            elements = <FoldoutElementComponent label={materialProperty.Name.value}></FoldoutElementComponent>
        }
        

        setMaterials(elements)
    }

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            getMaterials();
        }
    }, []);
    
    return (
        <FoldoutComponent name={foldoutName.current} onOpen={()=>{setIsOpen(true)}} onClosed={()=>{setIsOpen(false)}}>
            {isOpen ? materials : <></>}
        </FoldoutComponent>
    )
}

const ClassificationsFoldout = (props: { property: { [attribute: string]: any }, ifcModel: IFCModel}) => {
    const [classifications, setClassifications] = useState(undefined);
    const [isOpen, setIsOpen] = useState(false);
    
    const getClassifications = async ()=>{
        const relAssociatesClassifications = await props.ifcModel.getAllPropertiesOfType(919958153);

        var elements: any[] = []; 
        var classificationsFound: string[] = [];

        for (const id in relAssociatesClassifications) {
            const relAssociatesClassification = relAssociatesClassifications[id];
            const relatedObjects = relAssociatesClassification.RelatedObjects as any[];
            
            const index = classificationsFound.findIndex((value) => value == relAssociatesClassification.Name.value);
            if(index != -1)
                continue;

            for(const handle of relatedObjects) {
                if(handle.value == props.property.expressID) {
                    const relClassification = await webIFC.properties.getItemProperties(props.ifcModel.ifcID, relAssociatesClassification.RelatingClassification.value)
                    const classification =  await webIFC.properties.getItemProperties(props.ifcModel.ifcID, relClassification.ReferencedSource.value)

                    elements.push(
                        relClassification.Name ?
                        <FoldoutComponent name={classification.Name.value}>
                            <FoldoutElementComponent label={relClassification.Name.value} value={relClassification.ItemReference.value}/>
                        </FoldoutComponent> :
                        <FoldoutComponent name={classification.Name.value}>
                            <FoldoutElementComponent label={relClassification.ItemReference.value}/>
                        </FoldoutComponent> 
                        
                    )

                    classificationsFound.push(relAssociatesClassification.Name.value)
                    break;
                }
            }
        }

        setClassifications(elements)
    }

    
    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
            
            getClassifications();
        }
    }, []);
    

    return (
        <FoldoutComponent name='Classifications' onOpen={()=>{setIsOpen(true)}} onClosed={()=>{setIsOpen(false)}}>
            {
                isOpen ? classifications : <></>
            }
        </FoldoutComponent>
    )
}

function PropertySetsFoldout(props: { property: { [attribute: string]: any }, ifcModel: IFCModel}) {
    const [propertySets, setPropertySets] = useState(undefined);
    const [isOpen, setIsOpen] = useState(false)

    const mounted = useRef(false);
    const getPropertySets = async () => {
        const propertySetsProperty = await webIFC.properties.getPropertySets(props.ifcModel.ifcID, props.property.expressID);

        if (propertySetsProperty.length != 0) {
            const elements = await Promise.all(propertySetsProperty.map(async propertySet => {
                const handles = propertySet.HasProperties as any[];
                
                var set: any;
                if(handles) {
                    set = await Promise.all(handles.map(async handle => {
                        const singleValue = await webIFC.properties.getItemProperties(props.ifcModel.ifcID, handle.value);
                        if(!singleValue.NominalValue) 
                            return <></>
                        else
                            return <FoldoutElementComponent label={singleValue.Name.value} value={singleValue.NominalValue.value + (singleValue.Unit ? " " + singleValue.Unit.value : "")}/>
                    }))
                } 
                
                return(
                    <FoldoutComponent name={propertySet.Name.value}>
                        {set}
                    </FoldoutComponent>
                )
            }))

            setPropertySets(elements);
        }
    }


    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            getPropertySets();
        }
    }, [])

    return (
        <FoldoutComponent name='Property Sets' onOpen={()=>{setIsOpen(true)}} onClosed={()=>{setIsOpen(false)}}>
            {isOpen ? propertySets : <></>}
        </FoldoutComponent>
    )
}

function SpatialElementFoldout(props: { property: { [attribute: string]: any }, ifcModel: IFCModel }) {
    const [spatialElement, setSpatialElement] = useState(undefined);
    const mounted = useRef(false);
    
    const getSpatialStructure = async () => {
        const spatialStructure = await webIFC.properties.getSpatialStructure(props.ifcModel.ifcID);
        const spatialElementID = GetSpatialElement(spatialStructure, props.property.expressID);
        const spatialElementProperty = await webIFC.properties.getItemProperties(props.ifcModel.ifcID, spatialElementID);
        
        if (spatialElementProperty) {
            setSpatialElement(
                [
                    <FoldoutElementComponent label={'Name'} value={spatialElementProperty.Name.value}/>,
                    (spatialElementProperty.Elevation ? <FoldoutElementComponent label='Elevation' value={spatialElementProperty.Elevation.value}/> : <></>)
                ]
            )
        }
    }

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;
           
            getSpatialStructure();
    }}, []);

    return <FoldoutComponent name='Spatial Element'>{spatialElement}</FoldoutComponent>;
}
       
function GetSpatialElement(spatialStructure: any, id: number): number | null {
    if (!spatialStructure.children)
        return null;

    for (const child in spatialStructure.children) {
        if (spatialStructure.children[child].expressID == id)
            return spatialStructure.expressID;
        else {
            const result = GetSpatialElement(spatialStructure.children[child], id);
            if (result)
                return result;

            continue;
        }
    }

    return null; 
}

