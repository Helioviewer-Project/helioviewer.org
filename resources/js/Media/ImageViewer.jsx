import { Lightbox } from 'react-modal-image';
import { useState } from 'react';
import React from 'react';

export default function ImageViewer({imageURL, onCloseCallback, alt}) {

    const [open, setOpen] = useState(true)

    const onClose = () => {
        setOpen(!open); 
        onCloseCallback()
    }

    return open && <Lightbox alt={alt} medium={imageURL} large={imageURL} hideZoom={true} onClose={onClose} />

}

