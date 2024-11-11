import React, { useRef, useState } from 'react';
import { Button } from 'react-bootstrap';

const CameraCapture = ({ onPhotoCapture }) => {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);

  const startCamera = () => {
    setCameraOn(true);
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStream(stream);
      });
    }, 100);
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraOn(false);
    setStream(null);
  };

  const takePicture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 300, 300);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-image.png', { type: 'image/png' });
        onPhotoCapture(file); // Pass the captured image to the parent component
      }
    });
    closeCamera();
  };

  return (
    <div>
      {!cameraOn && (
        <Button onClick={startCamera} disabled={true}>Open Camera</Button>
      )}
      {cameraOn && (
        <>
          <video ref={videoRef} width="300" height="300" />
          <Button onClick={takePicture}>Take Picture</Button>
          <Button onClick={closeCamera}>Close Camera</Button>
        </>
      )}
    </div>
  );
};

export default CameraCapture;