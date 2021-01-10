import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { getPdf, savePdf } from '../services/pdfService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let ctx;
let page;
let renderCtx;

const initialStyle = {
    left: (window.innerWidth - 85) + 'px',
    top: (window.innerHeight - 245) + 'px',
    width: 80 + 'px',
    height: 240 + 'px',
}

export const EditPdf = (props) => {
    const pdfId = props.match.params.id;
    const loadedPdf = useRef();
    const canvasRef = useRef();

    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [navPosition, setNavPosition] = useState(initialStyle);
    const [isPdfEdited, setIsPdfEdited] = useState();


    useEffect(() => {
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
            top: (e.target.height + e.target.offsetTop - 245 * (1 / e.target.scale)) + 'px',
            width: 80 * (1 / e.target.scale) + 'px',
            height: 240 * (1 / e.target.scale) + 'px',
        }
        setNavPosition(style);
    }

    useEffect(() => {
        ctx = canvasRef.current.getContext('2d', { desynchronized: true });
        onGetPdf();
    }, [canvasRef])



    async function onGetPdf() {
        setIsLoading(true);
        loadedPdf.current = await getPdf(pdfId);
        if (!loadedPdf.current) return;
        setIsPdfEdited(loadedPdf.current.edited);
        onRenderCtx(loadedPdf.current.data);
        setIsLoading(false);
    }

    async function onRenderCtx(data) {
        if (!loadedPdf.current.edited) {
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

        } else {
            const img = new Image;
            img.onload = () => {
                canvasRef.current.height = img.height;
                canvasRef.current.width = img.width;
                ctx.drawImage(img, 0, 0);
            }
            img.src = data;
        }
        console.log(window);
        document.body.style.zoom=1.0
    }

    function onToggleEditMode() {
        if (!loadedPdf.current.edited) setIsEditMode((prev) => !prev);
    }

    function handleMouseDraw(e) {
        if (e.nativeEvent.which !== 1 || !isEditMode) return;
        const offsetX = e.nativeEvent.offsetX;
        const offsetY = e.nativeEvent.offsetY;
        draw(offsetX, offsetY);
    }

    function handleTouchDraw(e) {
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

    function finishPosition() {
        if (!isEditMode) return;
        ctx.beginPath();
    }

    async function clearCanvas() {
        if (!page || loadedPdf.current.edited) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        await page.render(renderCtx).promise;
    }


    async function onUpdatePdf() {
        if (!loadedPdf.current) return;
        const data = canvasRef.current.toDataURL("image/png");
        setIsLoading(true);
        setIsEditMode(false);
        const updatedPdf = await savePdf({ ...loadedPdf.current, data });
        loadedPdf.current = updatedPdf;
        if (!loadedPdf.current) return;
        setIsPdfEdited(loadedPdf.current.edited);
        onRenderCtx(loadedPdf.current.data);
        setIsLoading(false);


        // function dataURLtoFile(dataurl, filename) {
        //     let arr = dataurl.split(','),
        //         mime = arr[0].match(/:(.*?);/)[1],
        //         bstr = atob(arr[1]),
        //         n = bstr.length,
        //         u8arr = new Uint8Array(n);
        //     console.log(u8arr);
        //     while (n--) {
        //         u8arr[n] = bstr.charCodeAt(n);
        //     }
        //     console.log(u8arr);
        //     return new File([u8arr], filename, { type: mime });
        // }


        // const file = dataURLtoFile(data, fileName + '.png');
        // console.log(file);
        // const filesArray = [file];

        // if (navigator.share) {
        //     navigator.share({
        //         files: filesArray,
        //         text: fileName,
        //     })
        //         .then(() => console.log('Share was successful.'))
        //         .catch((error) => console.log('Sharing failed', error));
        // } else {
        //     console.log(`Your system doesn't support sharing files.`);
        // }

    }

    function onDownloadPdf() {
        const fileName = (loadedPdf?.current?.name || 'קבלה') + '.png';
        const a = document.createElement('a');
        a.href = canvasRef.current.toDataURL();
        a.download = fileName;
        a.click();
    }

    return (
        <div className="edit-pdf-container">
            <div className="nav-wrapper" style={navPosition && { ...navPosition }}>
                <div className={`actions flex column ${(isPdfEdited || isLoading) ? 'justify-end' : 'space-between'}`}>
                    <button className={`edit ${isEditMode ? 'active' : ''}`} onClick={onToggleEditMode} hidden={isPdfEdited || isLoading} />
                    <button className="reset" onClick={clearCanvas} hidden={isPdfEdited || isLoading} />
                    {!isPdfEdited ?
                        <button className={`done ${isLoading ? 'loading' : ''}`} onClick={onUpdatePdf} /> :
                        <>
                            <div className="saved-successfuly flex align-center justify-center" ><p style={{ fontSize: navPosition.width }}>נשמר בהצלחה!</p></div>
                            <button className="download" onClick={onDownloadPdf} />
                        </>}
                </div>
            </div>

            <div className="canvas-container">
                <canvas ref={canvasRef} className="pdf-canvas" onMouseDown={handleMouseDraw} onMouseMove={handleMouseDraw}
                    onMouseUp={finishPosition} onTouchStart={handleTouchDraw} onTouchMove={handleTouchDraw}
                    onTouchEnd={finishPosition} style={{ touchAction: isEditMode ? 'none' : 'auto' }}></canvas>
            </div>

        </div>
    );
}

