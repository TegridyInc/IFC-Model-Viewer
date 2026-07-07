import { useState, useRef, useEffect } from 'react'; 
import { world, culler, postproduction, ambientOclussion } from '../Components'
import { styled, MenuItem, SelectChangeEvent, Stack, FormControl, InputLabel } from '@mui/material';
import Slider, {Range} from '@pim_platform/components/ifc-viewer/slider/Slider.component'
import {Checkbox, CheckboxContainer, CheckboxLabel} from '@pim_platform/components/ifc-viewer/inputs/Checkbox'

import { SelectInput } from '../inputs/Select';
import Foldout from '../foldout/Foldout.component'
import Window from '@pim_platform/components/ifc-viewer/window/Window.component'

export type SettingsPreset = {
    projection: 'perspective' | 'orthographic';
    navigation: 'orbit' | 'first-person';
    cullerThreshold: Range;
    postProduction: {
        ao: {
            enabled: boolean;
            halfResolution: boolean;
            screenSpaceRadius: boolean;
            samples: Range;
            denoiseSamples: Range;
            denoiseRadius: Range;
            aoRadius: Range;
            distanceFalloff: Range;
            intensity: Range;
        }
        lineEffect: {
            enabled: boolean;
            gammaCorrection: boolean;
            opacity: Range;
            tolerance: Range;
        }
        glossEffect: {
            enabled: boolean;
            glossExponent: Range;
            maxGloss: Range;
            minGloss: Range;
        }
    }
}

enum Navigation {
    Orbit,
    FirstPerson
}

enum Projection {
    Perspective,
    Orthographic
}

const defaultPreset = ():SettingsPreset => {
    return {
        projection: 'perspective',
        navigation: 'orbit',
        cullerThreshold: {
            min: 0,
            value: 0,
            max: 50
        },
        postProduction: {
            ao: {
                enabled: false,
                halfResolution: false,
                screenSpaceRadius: false,
                samples: {
                    min: 1,
                    value: 8,
                    max: 16
                },
                denoiseSamples: {
                    min: 1,
                    value: 8,
                    max: 16
                },
                denoiseRadius: {
                    min: 0,
                    value: 50,
                    max: 100
                },
                aoRadius: {
                    min: 0,
                    value: 2,
                    max: 16
                },
                distanceFalloff: {
                    min: 0,
                    value: 4,
                    max: 16
                },
                intensity: {
                    min: 0,
                    value: 2,
                    max: 16
                },
            },
            lineEffect: {
                enabled: false,
                gammaCorrection: true,
                opacity: {
                    min: 0,
                    value: 0,
                    max: 1
                },
                tolerance: {
                    min: 0,
                    value: 0,
                    max: 6
                }
            },
            glossEffect: {
                enabled: false,
                glossExponent: {
                    min:0,
                    value: 1.9,
                    max: 5
                },
                maxGloss:  {
                    min: -2,
                    value: .1,
                    max: 2
                },
                minGloss:  {
                    min: -2,
                    value: -.1,
                    max: 2
                }
            }
        }
    }
}

const Settings = styled(Window)();

const SelectLabel = styled(InputLabel)({
    color: '#909090'
})

const SettingsComponent = () => {        
    const [preset, setPreset] = useState(defaultPreset());

    const rootRef = useRef<HTMLDivElement>(undefined);
    const containerRef = useRef<HTMLDivElement>(undefined);
    const mounted = useRef(false);

    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            const openSettings = document.getElementById('open-settings')
            openSettings.addEventListener('click', () => {
                if(containerRef.current.parentElement == rootRef.current) 
                    rootRef.current.style.visibility = 'visible'
            })
        }
    }, [])



    return (
        <Settings label={'Settings'} root={rootRef} container={containerRef}>
            <Stack spacing={.5}>
                <CameraComponent preset={preset} setPreset={setPreset}/>
                <GraphicsComponent preset={preset} setPreset={setPreset}/>
         
            </Stack>
        </Settings> 
    )
}

const CameraFormControl = styled(FormControl)(({theme})=>({
    '& > .MuiInputBase-formControl': {
        background: 'none'
    },

    '& > .MuiFormLabel-root.Mui-focused': {
        color: theme.palette.secondary.dark
    }
}))

const CameraSettingsContainer = styled('div')(({theme})=>({
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
}))

const CameraComponent = (props: {preset: SettingsPreset, setPreset: React.Dispatch<React.SetStateAction<SettingsPreset>>}) => {
    const [projection, setProjection] = useState(Projection.Perspective)
    const [navigation, setNavigation] = useState(Navigation.Orbit)

    const changeProjection = (e: SelectChangeEvent<number>)=>{
        world.camera.projection.set(e.target.value ? 'Orthographic' : 'Perspective')
        
        setProjection(e.target.value as number)
        props.setPreset(preset => {
            preset.projection = projection == Projection.Perspective ? 'perspective' : 'orthographic'
            return preset;
        })
    }

    const changeNavigation = (e: SelectChangeEvent<number>)=>{
        world.camera.set(e.target.value ? 'FirstPerson' : 'Orbit');
        
        setNavigation(e.target.value as number)
        props.setPreset(oldPreset => {
            oldPreset.navigation = navigation == 0 ? 'orbit' : 'first-person'
            return oldPreset;
        })
    }


    return (
        <Foldout label='Camera' addRightPadding>
            <CameraSettingsContainer>
                <CameraFormControl variant="standard" fullWidth>
                    <SelectLabel id='projection-label'>Projection</SelectLabel>
                    <SelectInput labelId='projection-label' label='Projection' value={projection} onChange={changeProjection}>
                        <MenuItem value={Projection.Perspective}>Perspective</MenuItem>
                        <MenuItem disabled={navigation == 1} value={Projection.Orthographic}>Orthographic</MenuItem>
                    </SelectInput>
                </CameraFormControl>
                <CameraFormControl variant="standard" fullWidth>
                    <SelectLabel id='navigation-label'>Navigation</SelectLabel>
                    <SelectInput labelId='navigation-label' label='Navigation' value={navigation} onChange={changeNavigation}>
                        <MenuItem value={0}>Orbit</MenuItem>
                        <MenuItem disabled={projection == 1} value={1}>First Person</MenuItem>
                    </SelectInput>
                </CameraFormControl>        
            </CameraSettingsContainer>
        </Foldout>
    )
}

const GraphicsComponent = (props: {preset: SettingsPreset, setPreset: React.Dispatch<React.SetStateAction<SettingsPreset>>}) => {
    const preset = props.preset;
    
    const updateCullerThreshold = () => {
        culler.config.threshold = preset.cullerThreshold.value;
        culler.needsUpdate = true
    }

    const updateAmbientOcclusion = () => {
        postproduction.setPasses({ao: preset.postProduction.ao.enabled})
        ambientOclussion.halfRes = preset.postProduction.ao.halfResolution;
        ambientOclussion.screenSpaceRadius = preset.postProduction.ao.screenSpaceRadius;
        ambientOclussion.aoSamples = preset.postProduction.ao.samples.value;  
        ambientOclussion.denoiseSamples = preset.postProduction.ao.denoiseSamples.value;  
        ambientOclussion.denoiseRadius = preset.postProduction.ao.denoiseRadius.value;  
        ambientOclussion.aoRadius = preset.postProduction.ao.aoRadius.value;  
        ambientOclussion.distanceFalloff = preset.postProduction.ao.distanceFalloff.value;  
        ambientOclussion.intensity = preset.postProduction.ao.intensity.value;  
    }

    const updateLineEffect = () => {
        postproduction.setPasses({ custom: preset.postProduction.lineEffect.enabled })
        postproduction.setPasses({ gamma: preset.postProduction.lineEffect.gammaCorrection && preset.postProduction.lineEffect.enabled })
        postproduction.customEffects.opacity = preset.postProduction.lineEffect.opacity.value;
        postproduction.customEffects.tolerance = preset.postProduction.lineEffect.tolerance.value;
    }

    const updateGlossEffect = () => {
        postproduction.customEffects.glossEnabled = preset.postProduction.glossEffect.enabled;
        postproduction.customEffects.glossExponent = preset.postProduction.glossEffect.glossExponent.value;
        postproduction.customEffects.minGloss = preset.postProduction.glossEffect.minGloss.value;
        postproduction.customEffects.maxGloss = preset.postProduction.glossEffect.maxGloss.value;
    }

    return (
        <Foldout label='Graphics' addRightPadding>
            <Slider label='Culler Threshold' range={preset.cullerThreshold}  onChange={updateCullerThreshold}/>

            <Foldout label='Post Production'>
                <Foldout label={
                    <>
                        <Checkbox defaultChecked={preset.postProduction.ao.enabled} onChange={(e, v) => {preset.postProduction.ao.enabled = v; updateAmbientOcclusion()}}/>
                        <div>Ambient Oclussion</div>
                    </>
                }>
                    <CheckboxContainer>
                        <CheckboxLabel>Half Resolution</CheckboxLabel>
                        <Checkbox defaultChecked={preset.postProduction.ao.halfResolution} onChange={(e, v) => {preset.postProduction.ao.halfResolution = v; updateAmbientOcclusion()}}/>
                    </CheckboxContainer>
                    <CheckboxContainer>
                        <CheckboxLabel>Screen Space Radius</CheckboxLabel>
                        <Checkbox defaultChecked={preset.postProduction.ao.screenSpaceRadius} onChange={(e, v) => {preset.postProduction.ao.screenSpaceRadius = v; updateAmbientOcclusion()}}/>
                    </CheckboxContainer>
                    <Slider label='Samples'          onChange={updateAmbientOcclusion} range={preset.postProduction.ao.samples}/>
                    <Slider label='Denoise Samples'  onChange={updateAmbientOcclusion} range={preset.postProduction.ao.denoiseSamples}/>
                    <Slider label='Denoise Radius'   onChange={updateAmbientOcclusion} range={preset.postProduction.ao.denoiseRadius}/>
                    <Slider label='AO Radius'        onChange={updateAmbientOcclusion} range={preset.postProduction.ao.aoRadius}/>
                    <Slider label='Distance Falloff' onChange={updateAmbientOcclusion} range={preset.postProduction.ao.distanceFalloff}/>
                    <Slider label='Intensity'        onChange={updateAmbientOcclusion} range={preset.postProduction.ao.intensity}/>
                </Foldout>
                <Foldout label='Line Edges' header={
                    <Checkbox onChange={(e, v)=>{preset.postProduction.lineEffect.enabled = v; updateLineEffect()}} defaultChecked={preset.postProduction.lineEffect.enabled}/>
                }>
                    <CheckboxContainer>
                        <CheckboxLabel>Gamma Correction</CheckboxLabel>
                        <Checkbox onChange={(e, v)=>{preset.postProduction.lineEffect.gammaCorrection = v; updateLineEffect()}} defaultChecked={preset.postProduction.lineEffect.gammaCorrection}></Checkbox>
                    </CheckboxContainer>
                    <Slider onChange={updateLineEffect} label='Opacity'   step={.01} range={preset.postProduction.lineEffect.opacity}/>
                    <Slider onChange={updateLineEffect} label='Tolarance' step={.1}  range={preset.postProduction.lineEffect.tolerance}/>
                </Foldout>
                <Foldout label='Gloss' header={
                    <Checkbox onChange={(e, v)=>{preset.postProduction.glossEffect.enabled = v; updateGlossEffect()}} defaultChecked={preset.postProduction.glossEffect.enabled}/>
                }>
                    <Slider onChange={updateGlossEffect} label='Gloss Exponent' step={.1} range={preset.postProduction.glossEffect.glossExponent} />
                    <Slider onChange={updateGlossEffect} label='Max Gloss'      step={.1} range={preset.postProduction.glossEffect.maxGloss}/>
                    <Slider onChange={updateGlossEffect} label='Min Gloss'      step={.1} range={preset.postProduction.glossEffect.minGloss}/>
                </Foldout>
            </Foldout>
        </Foldout>
    )
}


export default SettingsComponent;

