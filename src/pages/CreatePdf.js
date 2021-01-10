import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { savePdf } from '../services/pdfService';
import img from '../images/D-signature-logo.png';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let ctx;
let page;
let renderCtx;
const file = new FileReader();


const initialStyle = {
    left: (window.innerWidth - 85) + 'px',
    top: (window.innerHeight - 165) + 'px',
    width: 80 + 'px',
    height: 160 + 'px',
}


export const CreatePdf = () => {
    const canvasRef = useRef();
    const fileName = useRef('file.png');
    const [isLoading, setIsLoading] = useState(false);
    const [link, setLink] = useState();
    const [navPosition, setNavPosition] = useState(initialStyle);

    useEffect(() => {
        if (!window.visualViewport) return;
        window.visualViewport.addEventListener("resize", viewportHandler);
        window.visualViewport.addEventListener("scroll", viewportHandler);

        return (() => {
            window.visualViewport.removeEventListener("resize", viewportHandler);
            window.visualViewport.removeEventListener("scroll", viewportHandler);
        })
    }, [])

    const viewportHandler = (e) => {
        const style = {
            left: (e.target.width + e.target.offsetLeft - 85 * (1 / e.target.scale)) + 'px',
            top: (e.target.height + e.target.offsetTop - 165 * (1 / e.target.scale)) + 'px',
            width: 80 * (1 / e.target.scale) + 'px',
            height: 160 * (1 / e.target.scale) + 'px',
        }
        setNavPosition(style);
    }

    useEffect(() => {
        ctx = canvasRef.current.getContext('2d');
    }, [canvasRef])

    useEffect(() => {
        if (!link) return;
        if ('share' in navigator) window.open(`whatsapp://send?text=${encodeURIComponent(`${link} חתימה דיגיטלית`)}`)
        else window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(`${link} חתימה דיגיטלית`)}`);
    }, [link])

    const handlePdf = async (e) => {
        await setLink(null);
        file.onload = () => {
            fileName.current = e.target.files[0].name.split('.')[0];
            onRenderCtx(file.result);
        }


        if (e.target.files.length) await file.readAsDataURL(e.target.files[0])
    }

    async function onRenderCtx(data) {
        const doc = await pdfjsLib.getDocument(data).promise;
        page = await doc.getPage(1);
        const viewport = await page.getViewport({ scale: 2 });
        canvasRef.current.height = viewport.height;
        canvasRef.current.width = viewport.width;

        renderCtx = {
            canvasContext: ctx,
            viewport
        }

        await page.render(renderCtx).promise;
    }

    async function onSavePdf() {
        if (!file.result) return;
        setIsLoading(true);
        try {
            const pdfToSave = { data: file.result, name: fileName.current }
            const savedPdf = await savePdf(pdfToSave);
            setLink(window.location.origin + '/preview/' + savedPdf._id);
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="create-pdf-container">
            <div className="nav-wrapper" style={navPosition}>

                <div className="actions flex column space-between">
                    <input className="pdf-input" id="pdf-file-input" type="file" accept="application/pdf" onChange={handlePdf} hidden />
                    <label className="upload" htmlFor="pdf-file-input">
                        <div />
                    </label>
                    <div className={`link ${isLoading ? 'loading' : ''}`} onClick={onSavePdf} />
                </div>

            </div>
            <div className="canvas-container">
                <canvas ref={canvasRef} className="pdf-canvas"></canvas>
            </div>
        </div>
    );
}
