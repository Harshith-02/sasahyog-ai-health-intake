import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder({ onAudioStart, onAudioChunk, onAudioEnd, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioBlobsRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      return;
    }

    try {
      audioBlobsRef.current = [];
      setRecordingDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';

      // Synchronously collect raw Blob chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioBlobsRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopTimer();

        // Release hardware microphone stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Combine all chunks into one complete valid Audio Blob
        if (audioBlobsRef.current.length > 0) {
          const completeBlob = new Blob(audioBlobsRef.current, { type: actualMimeType });
          console.log(`[useAudioRecorder] Complete audio recording blob size: ${completeBlob.size} bytes (${actualMimeType})`);

          // Convert Blob to Base64
          const arrayBuffer = await completeBlob.arrayBuffer();
          const base64String = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          // Transmit complete turn data payload in order
          if (onAudioStart) onAudioStart(actualMimeType);
          if (onAudioChunk) onAudioChunk(base64String);
        }

        if (onAudioEnd) onAudioEnd();
      };

      mediaRecorder.start(100); // Sample every 100ms
      setIsRecording(true);

      // Start duration counter
      stopTimer();
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[useAudioRecorder] Permission / Hardware error:', err);
      setIsRecording(false);
      stopTimer();
      if (onError) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          onError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else {
          onError('Could not access microphone: ' + (err.message || 'Unknown error'));
        }
      }
    }
  }, [onAudioStart, onAudioChunk, onAudioEnd, onError]);

  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
