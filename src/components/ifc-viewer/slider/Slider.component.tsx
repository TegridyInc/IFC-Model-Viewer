import { 
    styled, 
    Slider as MatSlider, 
} from '@mui/material'
import { Event } from 'three';

const Slider = styled(MatSlider)(({theme})=>({
    overflow: 'unset',
    marginTop: '25px',
    marginLeft: '10px',
    width: 'auto',
    color: theme.palette.secondary.dark,

    '& > .MuiSlider-thumb': {
        width: 'unset',
        height: '16px',
        aspectRatio: 1
    }
}))

const SliderContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
});

const SliderLabel = styled('div')(({theme})=> ({
    position: 'absolute',
    fontSize: '13px',
    color: theme.palette.text.primary,
    top: '5px',
    left: '15px'
}))

export type Range = {
    max: number;
    min: number;
    value: number;
}

export const SliderComponent = (props: {label:string, range?: Range, step?: number, onChange?:(event: Event, value: number)=>void})=>{
    const handleSliderChange = (e: Event, v: number) => {
        if(props.range)
            props.range.value = v;

        if(props.onChange)
            props.onChange(e, v)
    }

    return (
        <SliderContainer>
            <SliderLabel>{props.label}</SliderLabel>
            <Slider defaultValue={props.range.value.valueOf()} min={props.range.min} max={props.range.max} step={props.step} onChange={handleSliderChange} valueLabelDisplay='auto'/>
        </SliderContainer>
    )
}

export default SliderComponent;