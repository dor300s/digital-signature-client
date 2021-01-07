import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { savePdf } from '../services/pdfService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let ctx;
let page;
let renderCtx;
const file = new FileReader();
let fileToSend;



export const CreatePdf = () => {
    const canvasRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [link, setLink] = useState();

    useEffect(() => {
        console.log(canvasRef);
        ctx = canvasRef.current.getContext('2d');
    }, [canvasRef])

    const handlePdf = async (e) => {
        file.onload = () => {
            onRenderCtx(file.result);
            console.log(file);
        }
        fileToSend = e.target.files[0];
        await file.readAsDataURL(e.target.files[0])
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
        setIsLoading(true);
        const pdfToSave = { data: file.result }
        const savedPdf = await savePdf(pdfToSave);
        setIsLoading(false);
        setLink(window.location.origin + '/' + savedPdf._id);
    }

    return (
        <div className="create-pdf-container">

            <div className="nav-wrapper">
                <input className="pdf-input" id="pdf-file-input" type="file" accept="application/pdf" onChange={handlePdf} hidden />
                <div className="actions">
                    <label htmlFor="pdf-file-input">UPLOAD</label>
                    <button onClick={onSavePdf}>GET LINK</button>
                </div>
                {isLoading && <p>Loading...</p>}
                {link && <p>{link}</p>}

            </div>
            <canvas ref={canvasRef} className="pdf-canvas"></canvas>

        </div>
    );
}
