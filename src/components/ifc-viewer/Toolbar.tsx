import { exploder, culler, highlighter, clipper } from './Components'
import { LoadIFCModel } from './IFCLoader'
import { styled, Stack, Divider, ToggleButtonGroup, Tooltip } from '@mui/material';
import { IconButton, ToggleButton } from './inputs/Buttons'
import { useRef, useState, useEffect, ChangeEvent, MouseEvent } from 'react';

export enum Tools {
    Select,
    Move,
    Clipper
}

export var toolEnabled = true;

var toolSelection: HTMLElement;
var openToolSelection: HTMLElement;
var currentTool = Tools.Select;
var onToolChanged = new CustomEvent('onToolChanged', { detail: currentTool })

const ViewportControls = styled(Stack)(({theme})=>({
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    border: `1px solid ${theme.palette.secondary.light}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.primary.main,
    padding: '3px',
}))

const ToolbarDivider = styled(Divider)(({theme})=>({
    backgroundColor: theme.palette.secondary.light,
    width: '0px',
    height: 'auto'
}))

const ToolSelection = styled(ToggleButtonGroup)(({theme})=>({
    display: 'flex',
    visibility: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    bottom: '40px',
    position: 'absolute',
    zIndex: '-10',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: theme.palette.secondary.dark   ,
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: '2px'
}))

export default function Toolbar() {
    const toolSelectionRef = useRef<HTMLDivElement>(undefined);

    const [tool, setTool] = useState(0)
    const [exploded, setExploded] = useState(false);

    const mounted = useRef(false)
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            toolSelection = document.getElementById('tool-selection');
            openToolSelection = document.getElementById('open-tool-selection');
        }
    }, [])

    const createIFCModel = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files[0];
        if (!file)
            return;

        const reader = new FileReader();
        reader.onload = () => {
            LoadIFCModel(reader.result as ArrayBuffer, file.name.split(".ifc")[0]);
        }

        reader.readAsArrayBuffer(file);
    }

    const explodeModel = ()=>{
        setExploded((oldValue)=> !oldValue)
        exploder.set(!exploded);

        culler.needsUpdate = true;
    }

    const changeTool = (e: MouseEvent<HTMLElement>, v: number) => {
        if(v == null)
            return;

        setTool(v)
        const toolElement = e.target as HTMLElement;
     
        if(currentTool == v)
            return;

        if(toolEnabled)
            DeactivateTool();
       
        currentTool = v;
        onToolChanged = new CustomEvent('onToolChanged', {detail:v})
        document.dispatchEvent(onToolChanged)
    
        if(toolEnabled)
            ActivateTool();
        
        openToolSelection.innerHTML = toolElement.innerHTML;
        toolSelection.style.visibility = 'hidden'
    }

    return (
        <ViewportControls id='viewport-controls' direction={'row'} spacing={.5} divider={<ToolbarDivider orientation='vertical'/>}>
            <Tooltip title={'Model Manager'}>
                <IconButton id='open-model-manager'>menu</IconButton>
            </Tooltip>
            <Tooltip title={'Settings'}>
                <IconButton id='open-settings'>settings</IconButton>
            </Tooltip>
            <Tooltip title={'Upload IFC'}>
                <IconButton>
                    upload_file
                    <label style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
                        <input type="file" id="ifc-file-upload" accept=".ifc" hidden onInput={createIFCModel} />
                    </label>
                </IconButton>
            </Tooltip>
            <Tooltip title={'Explode Models'}>
                <ToggleButton value={exploded} selected={exploded} id='explode' onClick={explodeModel}>explosion</ToggleButton>
            </Tooltip>
            <div style={{position: 'relative'}} id='tools'>
                <Tooltip title={'Select Tool'}>
                    <IconButton id='open-tool-selection' onClick={()=>{ toolSelectionRef.current.style.visibility = 'visible' }}>arrow_selector_tool</IconButton>
                </Tooltip>
                <ToolSelection id='tool-selection' ref={toolSelectionRef} value={tool} exclusive onChange={changeTool}>
                    <Tooltip title={'Highlighter'}>
                        <ToggleButton color='primary' size='small' value={0} className='unselectable'>arrow_selector_tool</ToggleButton>
                    </Tooltip>
                    <Tooltip title={'Move'}>
                        <ToggleButton color='primary' size='small' value={1} className='unselectable'>open_with</ToggleButton>
                    </Tooltip>
                    <Tooltip title={'Clipper'}>
                        <ToggleButton color='primary' size='small' value={2} className='unselectable'>start</ToggleButton>
                    </Tooltip>
                </ToolSelection>
            </div>
            <Tooltip title={'IFC Properties'}>
                <IconButton id='open-properties'>data_object</IconButton>
            </Tooltip>
        </ViewportControls>
    );
}

export function DeactivateTool() {
    switch (currentTool) {
        case Tools.Select:
            highlighter.clear();
            highlighter.enabled = false;
            break;
        case Tools.Move:
            break;
        case Tools.Clipper:
            clipper.deleteAll();
            clipper.enabled = false;
            break;
    }
}

export function ActivateTool() {
    switch (currentTool) {
        case Tools.Select:
            highlighter.enabled = true;
            break;
        case Tools.Move:

            break;
        case Tools.Clipper:
            clipper.enabled = true;
            break;
    }
}

export function DisableTool() {
    DeactivateTool();
    toolEnabled = false;
}

export function EnableTool() {
    ActivateTool();
    toolEnabled = true;
}




