import {Alert, AlertColor, styled} from '@mui/material'
import { useEffect, useRef, useState } from 'react';

var onNotificationAdded = new CustomEvent<Notification>('onNotificationAdded');
var onNotificationRemoved = new CustomEvent<Notification>('onNotificationRemoved')

export class Notification {
    text: string;
    type: AlertColor;
    autoClear: boolean;
    clearDelay: number;

    constructor(text: string, type: AlertColor, autoClear: boolean = true, clearDelay?: number) {
        this.text = text;
        this.type = type;
        this.autoClear = autoClear;
        this.clearDelay = clearDelay ? clearDelay : 3000;

        onNotificationAdded = new CustomEvent<Notification>('onNotificationAdded', {detail: this})
        document.dispatchEvent(onNotificationAdded);
    }
    
    Clear() {
        onNotificationRemoved = new CustomEvent<Notification>('onNotificationRemoved', {detail: this});
        document.dispatchEvent(onNotificationRemoved)
    } 
}

const Notifications = styled('div')({
    bottom: '50px',
    left: '50px',
    display: 'flex',
    position: 'absolute',
    zIndex: '100',
    flexDirection: 'column',
    gap: '5px',
    pointerEvents: 'none'
})

const NotificationsComponent = ()=>{
    const [notifications, setNotification] = useState([])

    const mounted = useRef(false);
    useEffect(()=>{
        if(!mounted.current) {
            mounted.current = true;

            document.addEventListener('onNotificationAdded', addNotification)
        }
    }, [])

    const addNotification = (event: CustomEvent<Notification>)=>{
        const notification = event.detail;
        if(!notification)
            return;
        
        const element = (
            <Alert severity={notification.type} variant={'filled'}>{notification.text}</Alert>
        );

        setNotification(oldItems => [...oldItems, element])

        if(notification.autoClear) {
            setTimeout(()=>{
                setNotification(oldItems => oldItems.filter(item => item != element))
            }, notification.clearDelay);
        } else {
            document.addEventListener('onNotificationRemoved', (event: CustomEvent<Notification>)=>{
                if(notification == event.detail) {
                    setNotification(oldItems => oldItems.filter(item => item != element))
                }
            }, {once: true})
        }
    }

    return (
        <Notifications>
            {notifications}
        </Notifications>
    )
}

export default NotificationsComponent;