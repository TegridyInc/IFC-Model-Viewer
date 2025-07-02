import {WindowComponent, SelectInput, SelectLabel, FoldoutComponent, Checkbox, CheckboxLabel, SliderComponent, CheckboxContainer} from './UIUtility.component'
import { useState, useRef, useEffect } from 'react'; 
import { world, culler, postproduction, ambientOclussion } from '../Viewer/Components'
import { styled, MenuItem, SelectChangeEvent, Stack, FormControl } from '@mui/material';

export type Range = {
    max: number;
    min: number;
    value: number;
}

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

const Settings = styled(WindowComponent)();

const SettingsComponent = () => {    
    const [projection, setProjection] = useState(0)
    const [navigation, setNavigation] = useState(0)
    
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

    const changeProjection = (e: SelectChangeEvent<number>)=>{
        world.camera.projection.set(e.target.value ? 'Orthographic' : 'Perspective')
        
        setProjection(e.target.value as number)
        setPreset(oldPreset => {
            oldPreset.projection = projection == 0 ? 'perspective' : 'orthographic'
            return oldPreset;
        })
    }

    const changeNavigation = (e: SelectChangeEvent<number>)=>{
        world.camera.set(e.target.value ? 'FirstPerson' : 'Orbit');
        
        setNavigation(e.target.value as number)
        setPreset(oldPreset => {
            oldPreset.navigation = navigation == 0 ? 'orbit' : 'first-person'
            return oldPreset;
        })
    }

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
        <Settings label={'Settings'} root={rootRef} container={containerRef}>
            <Stack spacing={.5}>
                <FoldoutComponent name='Camera'  sx={{border: '1px solid', borderColor: 'secondary.light'}}>
                    <FormControl variant="filled" fullWidth>
                        <SelectLabel id='projection-label'>Projection</SelectLabel>
                        <SelectInput labelId='projection-label' label='Projection' value={projection} onChange={changeProjection}>
                            <MenuItem value={0}>Perspective</MenuItem>
                            <MenuItem disabled={navigation == 1} value={1}>Orthographic</MenuItem>
                        </SelectInput>
                    </FormControl>
                    <FormControl variant="filled" fullWidth>
                        <SelectLabel id='navigation-label'>Navigation</SelectLabel>
                        <SelectInput labelId='navigation-label' label='Navigation' value={navigation} onChange={changeNavigation}>
                            <MenuItem value={0}>Orbit</MenuItem>
                            <MenuItem disabled={projection == 1} value={1}>First Person</MenuItem>
                        </SelectInput>
                    </FormControl>
                </FoldoutComponent>
    
                <FoldoutComponent name='Graphics' sx={{border: '1px solid', borderColor: 'secondary.light'}}>
                    <SliderComponent label='Culler Threshold' range={preset.cullerThreshold}  onChange={updateCullerThreshold}/>

                    <FoldoutComponent name='Post Production'>
                        <FoldoutComponent name='Ambient Oclussion' header={
                            <Checkbox defaultChecked={preset.postProduction.ao.enabled} onChange={(e, v) => {preset.postProduction.ao.enabled = v; updateAmbientOcclusion()}}/>
                        }>
                            <CheckboxContainer>
                                <CheckboxLabel>Half Resolution</CheckboxLabel>
                                <Checkbox defaultChecked={preset.postProduction.ao.halfResolution} onChange={(e, v) => {preset.postProduction.ao.halfResolution = v; updateAmbientOcclusion()}}/>
                            </CheckboxContainer>
                            <CheckboxContainer>
                                <CheckboxLabel>Screen Space Radius</CheckboxLabel>
                                <Checkbox defaultChecked={preset.postProduction.ao.screenSpaceRadius} onChange={(e, v) => {preset.postProduction.ao.screenSpaceRadius = v; updateAmbientOcclusion()}}/>
                            </CheckboxContainer>
                            <SliderComponent label='Samples'          onChange={updateAmbientOcclusion} range={preset.postProduction.ao.samples}/>
                            <SliderComponent label='Denoise Samples'  onChange={updateAmbientOcclusion} range={preset.postProduction.ao.denoiseSamples}/>
                            <SliderComponent label='Denoise Radius'   onChange={updateAmbientOcclusion} range={preset.postProduction.ao.denoiseRadius}/>
                            <SliderComponent label='AO Radius'        onChange={updateAmbientOcclusion} range={preset.postProduction.ao.aoRadius}/>
                            <SliderComponent label='Distance Falloff' onChange={updateAmbientOcclusion} range={preset.postProduction.ao.distanceFalloff}/>
                            <SliderComponent label='Intensity'        onChange={updateAmbientOcclusion} range={preset.postProduction.ao.intensity}/>
                        </FoldoutComponent>
                        <FoldoutComponent name='Line Edges' header={
                            <Checkbox onChange={(e, v)=>{preset.postProduction.lineEffect.enabled = v; updateLineEffect()}} defaultChecked={preset.postProduction.lineEffect.enabled}/>
                        }>
                            <CheckboxContainer>
                                <CheckboxLabel>Gamma Correction</CheckboxLabel>
                                <Checkbox onChange={(e, v)=>{preset.postProduction.lineEffect.gammaCorrection = v; updateLineEffect()}} defaultChecked={preset.postProduction.lineEffect.gammaCorrection}></Checkbox>
                            </CheckboxContainer>
                            <SliderComponent onChange={updateLineEffect} label='Opacity'   step={.01} range={preset.postProduction.lineEffect.opacity}/>
                            <SliderComponent onChange={updateLineEffect} label='Tolarance' step={.1}  range={preset.postProduction.lineEffect.tolerance}/>
                        </FoldoutComponent>
                        <FoldoutComponent name='Gloss' header={
                            <Checkbox onChange={(e, v)=>{preset.postProduction.glossEffect.enabled = v; updateGlossEffect()}} defaultChecked={preset.postProduction.glossEffect.enabled}/>
                        }>
                            <SliderComponent onChange={updateGlossEffect} label='Gloss Exponent' step={.1} range={preset.postProduction.glossEffect.glossExponent} />
                            <SliderComponent onChange={updateGlossEffect} label='Max Gloss'      step={.1} range={preset.postProduction.glossEffect.maxGloss}/>
                            <SliderComponent onChange={updateGlossEffect} label='Min Gloss'      step={.1} range={preset.postProduction.glossEffect.minGloss}/>
                        </FoldoutComponent>
                    </FoldoutComponent>
                </FoldoutComponent>
            </Stack>
        </Settings> 
    )
}

export default SettingsComponent;

