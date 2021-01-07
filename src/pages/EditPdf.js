import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { getPdf, savePdf } from '../services/pdfService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let ctx;
let page;
let renderCtx;
let loadedPdf;


export const EditPdf = (props) => {
    const pdfId = props.match.params.id;
    const canvasRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        console.log(canvasRef);
        ctx = canvasRef.current.getContext('2d');
        onGetPdf();
        console.log(props);
    }, [canvasRef])

    async function onGetPdf() {
        setIsLoading(true);
        loadedPdf = await getPdf(pdfId);
        setIsLoading(false);
        if (!loadedPdf) return;
        onRenderCtx(loadedPdf.data)
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

    function startPosition() {
        if (!isEditMode) return;
    }

    function finishPosition() {
        if (!isEditMode) return;
        ctx.beginPath();
    }

    function handleMouseMove(e) {
        if (e.nativeEvent.which !== 1 || !isEditMode) return;
        const offsetX = e.nativeEvent.offsetX;
        const offsetY = e.nativeEvent.offsetY;
        draw(offsetX, offsetY);
    }

    function handleTouchMove(e) {
        if (e.touches.length !== 1 || !isEditMode) return;
        var x = e.touches[0].clientX - e.touches[0].target.offsetLeft;
        var y = e.touches[0].clientY - e.touches[0].target.offsetTop;
        draw(x, y);
    }

    function draw(x, y) {
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    async function clearCanvas() {
        if (!page) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        await page.render(renderCtx).promise;
    }


    function getWhatsappHref() {

        let data = canvasRef.current.toDataURL("image/png");

        function dataURLtoFile(dataurl, filename) {
            let arr = dataurl.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        }

        const file = dataURLtoFile(data, 'Testttttt.png');
        const filesArray = [file];

        if (navigator.canShare && navigator.canShare({ files: filesArray })) {
            navigator.share({
                files: filesArray,
                title: 'Pictures',
                text: 'Our Pictures.',
            })
                .then(() => console.log('Share was successful.'))
                .catch((error) => console.log('Sharing failed', error));
        } else {
            console.log(`Your system doesn't support sharing files.`);
        }
    }

    return (
        <div className="edit-pdf-container">

            <div className="nav-wrapper">
                <div>
                    <button onClick={() => setIsEditMode((prev) => !prev)}>EDIT</button>
                    <button onClick={clearCanvas}>CLEAR</button>
                    <h3>{isEditMode ? 'yes' : 'no'}</h3>
                    <button onClick={getWhatsappHref}>SEND</button>
                </div>
            </div>

            <canvas ref={canvasRef} className="pdf-canvas" onMouseDown={startPosition} onMouseMove={handleMouseMove}
                onMouseUp={finishPosition} onTouchStart={startPosition} onTouchMove={handleTouchMove}
                onTouchEnd={finishPosition} style={{ touchAction: isEditMode ? 'none' : 'auto' }}></canvas>

        </div>
    );
}

