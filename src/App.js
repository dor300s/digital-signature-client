import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { getPdf, savePdf } from './services/pdfService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let ctx;
let page;
let renderCtx;
let isDrawMode = false;
const file = new FileReader();
let loadedPdf;

export const App = () => {
  const pdfId = window.location.pathname.slice(1);
  const canvasRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState();
  const [isEditMode, setIsEditMode] = useState(false);


  useEffect(() => {
    ctx = canvasRef.current.getContext('2d');
  }, [canvasRef.current])


  useEffect(() => {
    if (pdfId) onGetPdf();
  }, [pdfId])

  async function onGetPdf() {
    loadedPdf = await getPdf(pdfId);
    if (!loadedPdf) return;
    onRenderCtx(loadedPdf.data)
  }

  const handlePdf = async (e) => {
    // canvasRef.current.width = 0;
    // canvasRef.current.height = 0;

    file.onload = () => {
      onRenderCtx(file.result);
    }
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



  function startPosition() {
    if (!isEditMode) return;
    isDrawMode = true;
  }

  function finishPosition() {
    if (!isEditMode) return;
    isDrawMode = false;
    ctx.beginPath();

  }

  function handleMouseMove(e) {
    if (e.nativeEvent.which !== 1 || !isDrawMode || !isEditMode) return;
    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    draw(offsetX, offsetY);
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1 || !isDrawMode) return;
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

  async function onSavePdf() {
    // console.log(canvasRef.current.toDataURL("image/png"));
    setIsLoading(true);
    const pdfToSave = { data: file.result }
    const savedPdf = await savePdf(pdfToSave);
    setIsLoading(false);
    setLink(window.location.origin + '/' + savedPdf._id);
  }

  function getWhatsappHref() {
    const data = canvasRef.current.toDataURL("image/png");
    console.log(window.navigator);
    console.log(navigator.share);
    // console.log(data);
    // console.log(navigator);
    // window.open(`https://wa.me/972526716633?text=${data}`);
    // window.open(`whatsapp://send?photos=https://images.app.goo.gl/U1iPKKL6norJ45XA7')}`);
    // window.open('https://api.whatsapp.com/send?phone=972526716633');


  }

  return (
    <div className="App">

      <div className="nav-wrapper">
        <input className="pdf-input" id="pdf-file-input" type="file" accept="application/pdf" onChange={handlePdf} hidden />
        {!pdfId ?
          <div>
            <label htmlFor="pdf-file-input">UPLOAD</label>
            <button onClick={onSavePdf}>GET LINK</button>
            {isLoading && <p>Loading...</p>}
            {link && <p>{link}</p>}
          </div> :
          <div>
            <button onClick={() => setIsEditMode((prev) => !prev)}>EDIT</button>
            <p>{isEditMode ? 'yes' : 'no'}</p>
            <button onClick={clearCanvas}>CLEAR</button>
            <button onClick={() => getWhatsappHref()}>SEND</button>
          </div>}
      </div>

      <canvas ref={canvasRef} className="pdf-canvas" onMouseDown={startPosition} onMouseMove={handleMouseMove}
        onMouseUp={finishPosition} onTouchStart={startPosition} onTouchMove={handleTouchMove}
        onTouchEnd={finishPosition} style={{ touchAction: isEditMode ? 'none' : 'auto' }}></canvas>

    </div>
  );
}

export default App;
