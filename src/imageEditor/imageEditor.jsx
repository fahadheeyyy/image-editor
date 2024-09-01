import React, { useState, useRef, useEffect } from "react";

const ImageEditor = () => {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isMirroredH, setIsMirroredH] = useState(false);
  const [isMirroredV, setIsMirroredV] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [texts, setTexts] = useState([]);  // State to store multiple text boxes
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);  // State to store the index of selected text box
  const [isDraggingText, setIsDraggingText] = useState(false);
  const canvasRef = useRef(null);

  const loadImage = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        setImage(img);
        drawImage(img, 0, false, false);
        setHistory([
          {
            image: img,
            rotation: 0,
            isMirroredH: false,
            isMirroredV: false,
            texts: [],
          },
        ]);
        setRedoStack([]);
      };
    };
    reader.readAsDataURL(file);
  };

  const drawImage = (img, rotation, mirroredH, mirroredV) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const angleInRadians = (rotation * Math.PI) / 180;
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);
    const width = Math.abs(img.width * cos) + Math.abs(img.height * sin);
    const height = Math.abs(img.width * sin) + Math.abs(img.height * cos);

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angleInRadians);
    ctx.scale(mirroredH ? -1 : 1, mirroredV ? -1 : 1);

    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.restore();

    // Draw all text boxes
    texts.forEach((textObj) => {
      ctx.font = `${textObj.fontSize}px Arial`;
      ctx.fillStyle = textObj.color;
      ctx.fillText(textObj.text, textObj.position.x, textObj.position.y);
    });
  };

  const rotateImage = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);

    const newImage = new Image();
    newImage.src = canvasRef.current.toDataURL();
    newImage.onload = () => {
      drawImage(newImage, newRotation, isMirroredH, isMirroredV);
      setHistory([
        ...history,
        {
          image: newImage,
          rotation: newRotation,
          isMirroredH: isMirroredH,
          isMirroredV: isMirroredV,
          texts: [...texts],
        },
      ]);
      setRedoStack([]);
    };
  };

  const mirrorHorizontal = () => {
    const newMirroredH = !isMirroredH;
    setIsMirroredH(newMirroredH);

    const newImage = new Image();
    newImage.src = canvasRef.current.toDataURL();
    newImage.onload = () => {
      drawImage(newImage, rotation, newMirroredH, isMirroredV);
      setHistory([
        ...history,
        {
          image: newImage,
          rotation: rotation,
          isMirroredH: newMirroredH,
          isMirroredV: isMirroredV,
          texts: [...texts],
        },
      ]);
      setRedoStack([]);
    };
  };

  const mirrorVertical = () => {
    const newMirroredV = !isMirroredV;
    setIsMirroredV(newMirroredV);

    const newImage = new Image();
    newImage.src = canvasRef.current.toDataURL();
    newImage.onload = () => {
      drawImage(newImage, rotation, isMirroredH, newMirroredV);
      setHistory([
        ...history,
        {
          image: newImage,
          rotation: rotation,
          isMirroredH: isMirroredH,
          isMirroredV: newMirroredV,
          texts: [...texts],
        },
      ]);
      setRedoStack([]);
    };
  };

  const startCrop = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setStartPoint({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setCrop(null);
    setIsCropping(true);
  };

  const updateCrop = (e) => {
    if (!isCropping) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    setCrop({
      x: startPoint.x,
      y: startPoint.y,
      width: endX - startPoint.x,
      height: endY - startPoint.y,
    });
  };

  const endCrop = () => {
    setIsCropping(false);
  };

  const drawCropRectangle = () => {
    if (!crop) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawImage(image, rotation, isMirroredH, isMirroredV);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
  };

  const applyCrop = () => {
    if (!crop) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCanvas.width = crop.width;
    croppedCanvas.height = crop.height;

    croppedCtx.drawImage(
      canvas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedImageDataUrl = croppedCanvas.toDataURL();
    const croppedImage = new Image();
    croppedImage.src = croppedImageDataUrl;
    croppedImage.onload = () => {
      setImage(croppedImage);
      setCrop(null);
      setRotation(0);
      setIsMirroredH(false);
      setIsMirroredV(false);
      setHistory([
        ...history,
        {
          image: croppedImage,
          rotation: 0,
          isMirroredH: false,
          isMirroredV: false,
          texts: [...texts],
        },
      ]);
      setRedoStack([]);
      drawImage(croppedImage, 0, false, false);
    };
  };

  const undo = () => {
    if (history.length > 1) {
      const previousState = history[history.length - 2];
      setRedoStack([history[history.length - 1], ...redoStack]);
      setHistory(history.slice(0, history.length - 1));
      setImage(previousState.image);
      setRotation(previousState.rotation);
      setIsMirroredH(previousState.isMirroredH);
      setIsMirroredV(previousState.isMirroredV);
      setTexts(previousState.texts);
      drawImage(
        previousState.image,
        previousState.rotation,
        previousState.isMirroredH,
        previousState.isMirroredV
      );
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setRedoStack(redoStack.slice(1));
      setHistory([...history, nextState]);
      setImage(nextState.image);
      setRotation(nextState.rotation);
      setIsMirroredH(nextState.isMirroredH);
      setIsMirroredV(nextState.isMirroredV);
      setTexts(nextState.texts);
      drawImage(
        nextState.image,
        nextState.rotation,
        nextState.isMirroredH,
        nextState.isMirroredV
      );
    }
  };

  const addTextBox = () => {
    const newText = {
      text: "New Text",
      position: { x: 50, y: 50 },
      fontSize: 20,
      color: "#000000",
    };
    setTexts([...texts, newText]);
    setSelectedTextIndex(texts.length);
    drawImage(image, rotation, isMirroredH, isMirroredV);
  };

  const handleTextChange = (e) => {
    if (selectedTextIndex === null) return;
    const updatedTexts = [...texts];
    updatedTexts[selectedTextIndex].text = e.target.value;
    setTexts(updatedTexts);
    drawImage(image, rotation, isMirroredH, isMirroredV);
  };

  const handleFontSizeChange = (e) => {
    if (selectedTextIndex === null) return;
    const updatedTexts = [...texts];
    updatedTexts[selectedTextIndex].fontSize = e.target.value;
    setTexts(updatedTexts);
    drawImage(image, rotation, isMirroredH, isMirroredV);
  };

  const handleFontColorChange = (e) => {
    if (selectedTextIndex === null) return;
    const updatedTexts = [...texts];
    updatedTexts[selectedTextIndex].color = e.target.value;
    setTexts(updatedTexts);
    drawImage(image, rotation, isMirroredH, isMirroredV);
  };

  const handleTextMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    texts.forEach((textObj, index) => {
      const textWidth = textObj.text.length * textObj.fontSize; // Simplified calculation
      const textHeight = textObj.fontSize;

      if (
        clickX >= textObj.position.x &&
        clickX <= textObj.position.x + textWidth &&
        clickY >= textObj.position.y - textHeight &&
        clickY <= textObj.position.y
      ) {
        setSelectedTextIndex(index);
        setIsDraggingText(true);
      }
    });
  };

  const handleTextMouseUp = () => {
    setIsDraggingText(false);
  };

  const handleTextMouseMove = (e) => {
    if (!isDraggingText || selectedTextIndex === null) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const updatedTexts = [...texts];
    updatedTexts[selectedTextIndex].position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setTexts(updatedTexts);
    drawImage(image, rotation, isMirroredH, isMirroredV);
  };

  useEffect(() => {
    drawCropRectangle();
  }, [crop]);

  return (
    <div className="page-container">
      <div className="image-editor-options">
        <input type="file" onChange={loadImage} />
        <button onClick={rotateImage}>Rotate</button>
        <button onClick={mirrorHorizontal}>Mirror Horizontal</button>
        <button onClick={mirrorVertical}>Mirror Vertical</button>
        <button onClick={applyCrop}>Apply Crop</button>
        <button onClick={undo} disabled={history.length <= 1}>
          Undo
        </button>
        <button onClick={redo} disabled={redoStack.length === 0}>
          Redo
        </button>
        <button onClick={addTextBox}>Add Text</button>
        {selectedTextIndex !== null && (
          <>
            <input
              type="text"
              placeholder="Edit Text"
              value={texts[selectedTextIndex]?.text}
              onChange={handleTextChange}
            />
            <input
              type="number"
              value={texts[selectedTextIndex]?.fontSize}
              onChange={handleFontSizeChange}
              placeholder="Font Size"
            />
            <input
              type="color"
              value={texts[selectedTextIndex]?.color}
              onChange={handleFontColorChange}
            />
          </>
        )}
      </div>
      <div>
        <canvas
          ref={canvasRef}
          onMouseDown={isCropping ? startCrop : handleTextMouseDown}
          onMouseMove={isCropping ? updateCrop : handleTextMouseMove}
          onMouseUp={isCropping ? endCrop : handleTextMouseUp}
        />
      </div>
    </div>
  );
};

export default ImageEditor;
