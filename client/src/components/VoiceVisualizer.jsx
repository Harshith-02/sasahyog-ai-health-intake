import React, { useEffect, useRef } from 'react';

export function VoiceVisualizer({ status }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const numBars = 32;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / numBars - 2;

      phase += 0.08;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;

        if (status === 'LISTENING') {
          // Dynamic active recording wave
          barHeight = Math.sin(phase + i * 0.3) * (height / 2.5) + (height / 3);
          barHeight = Math.max(8, barHeight + Math.random() * 8);
        } else if (status === 'SPEAKING') {
          // AI voice wave
          barHeight = Math.cos(phase + i * 0.4) * (height / 2.8) + (height / 3.2);
          barHeight = Math.max(6, barHeight);
        } else if (status === 'PROCESSING') {
          // Gentle pulsing processing wave
          barHeight = Math.sin(phase * 1.5 + i * 0.2) * 12 + 10;
        } else {
          // Idle ambient pulse
          barHeight = Math.sin(phase * 0.5 + i * 0.15) * 4 + 6;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        // Gradient coloring based on state
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);

        if (status === 'LISTENING') {
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
        } else if (status === 'SPEAKING') {
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(1, '#0d9488');
        } else if (status === 'PROCESSING') {
          gradient.addColorStop(0, '#14b8a6');
          gradient.addColorStop(1, '#3b82f6');
        } else {
          gradient.addColorStop(0, '#334155');
          gradient.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4]);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-md">
      <canvas
        ref={canvasRef}
        width={320}
        height={48}
        className="w-full h-12"
      />
    </div>
  );
}
