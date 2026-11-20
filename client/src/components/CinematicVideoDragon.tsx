import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CinematicVideoDragonProps {
  className?: string;
  onEnded?: () => void;
  /** Distance (px) from the avatar centre up to the top crest of the active VIP frame */
  frameTopPx?: number;
}

// Canvas box & where the dragon's claws are inside it on the final perched frame
const DRAGON_W = 396;
const DRAGON_H = 196;
const FEET_X_RATIO = 0.477; // claws centre (x) in the clean video
const FEET_Y_RATIO = 0.907; // claws bottom (y) in the clean video
const CLAW_GRIP_PX = 3; // claws sink slightly into the crest so it looks gripped

const VS_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FS_SOURCE = `
precision highp float;
uniform sampler2D u_image;
varying vec2 v_texCoord;

void main() {
  vec4 col = texture2D(u_image, v_texCoord);

  // Luminance (brightness)
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));

  // Color saturation
  float minC = min(min(col.r, col.g), col.b);
  float maxC = max(max(col.r, col.g), col.b);
  float sat = (maxC > 0.001) ? (maxC - minC) / maxC : 0.0;

  // Whiteness metric: high when all R, G, B are high and saturation is minimal
  float whiteness = minC * (1.0 - sat * 1.5);

  // Fire / flame detection: bright orange, yellow, and red hues stay vivid & opaque
  bool isFire = (col.r > 0.65 && col.b < 0.60 && (col.r - col.b) > 0.10);

  // Smooth alpha threshold: pure white (whiteness > 0.96) becomes transparent
  float alpha = clamp((0.97 - whiteness) / 0.14, 0.0, 1.0);

  if (isFire) {
    alpha = max(alpha, 0.98);
  } else {
    // Erase light grey smoke / haze completely
    if (lum > 0.88 && sat < 0.15) {
      alpha = smoothstep(0.96, 0.85, lum);
    }
    if (sat < 0.18 && minC > 0.35) {
      alpha = 0.0;
    }
  }

  // Floor plane cutoff: clean up bottom floor shadow edge
  if (v_texCoord.y > 0.92 && !isFire) {
    if (minC > 0.78 && sat < 0.12) {
      alpha = 0.0;
    }
  }

  // Soft right-edge feather to guarantee zero sharp vertical edge cutoff
  float edgeFade = smoothstep(0.995, 0.92, v_texCoord.x);
  alpha *= edgeFade;

  gl_FragColor = vec4(col.rgb, alpha);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export const CinematicVideoDragon: React.FC<CinematicVideoDragonProps> = ({ className = '', onEnded, frameTopPx = 50 }) => {
  // Canvas (16:9) is object-contain'ed inside the box -> compute real claw position in px
  const contentW = Math.min(DRAGON_W, DRAGON_H * (16 / 9));
  const contentH = contentW / (16 / 9);
  const feetXPx = (DRAGON_W - contentW) / 2 + FEET_X_RATIO * contentW;
  const feetYPx = (DRAGON_H - contentH) / 2 + FEET_Y_RATIO * contentH;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isReplayingRef = useRef(false);
  const [isEnded, setIsEnded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Handle click/tap to restart the flight sequence
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    isReplayingRef.current = true;
    setIsEnded(false);
    video.currentTime = 0;
    video.play().then(() => {
      // HTML5 video seeking is asynchronous. Keep flag true until video is safely in playback from t=0
      setTimeout(() => {
        isReplayingRef.current = false;
      }, 400);
    }).catch(() => {
      isReplayingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let destroyed = false;
    let animId: number;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL not supported for transparent video');
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    gl.useProgram(program);

    // Full screen quad
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture coords (flip Y for video texture)
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0,
      ]),
      gl.STATIC_DRAW
    );

    const texLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.viewport(0, 0, canvas.width, canvas.height);

    const render = () => {
      if (destroyed) return;

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // Calm perched cutoff: at the end of the video sequence (t >= 9.5s), dragon is stably perched
      if (!isReplayingRef.current && video.currentTime >= 9.5 && !video.paused && !video.ended) {
        video.pause();
        setIsEnded(true);
        if (onEnded) onEnded();
      }

      animId = requestAnimationFrame(render);
    };

    // Auto-play video muted, DO NOT LOOP (stop at end on perched frame)
    video.muted = true;
    video.playsInline = true;
    video.loop = false;

    const handleVideoEnded = () => {
      setIsEnded(true);
      if (onEnded) onEnded();
    };

    video.addEventListener('ended', handleVideoEnded);

    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => {
          if (!destroyed) {
            render();
          }
        })
        .catch((err) => {
          console.warn('Video auto-play prevented:', err);
          render();
        });
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      video.removeEventListener('ended', handleVideoEnded);
      video.pause();
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (texture) gl.deleteTexture(texture);
    };
  }, [onEnded]);

  return (
    <div
      onClick={handleReplay}
      className={`select-none absolute z-25 flex items-center justify-center cursor-pointer group ${className}`}
      style={{
        width: `${DRAGON_W}px`,
        height: `${DRAGON_H}px`,
        left: '50%',
        top: '50%', // = avatar centre
        // Claws land exactly on the top crest of whatever VIP frame is active (never on the face)
        transform: `translate(${-feetXPx}px, ${-(feetYPx + frameTopPx - CLAW_GRIP_PX)}px)`,
      }}
      title="Ajdarchani qayta uchirish uchun bosing!"
      aria-label="Kinematik Ajdarho (uchish, qo'nish va olov)"
    >
      {/* Hidden source video (plays through once, then stays perched on last frame) */}
      <video
        ref={videoRef}
        src="/assets/dragon_cinematic_flight.mp4"
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
        onError={() => setLoadError(true)}
      />

      {/* Transparent WebGL Canvas with Realtime White-Removal Chroma Shader */}
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full h-full object-contain filter drop-shadow-[0_6px_20px_rgba(234,179,8,0.25)]"
      />

      {/* Subtle indicator when perched & paused */}
      {isEnded && (
        <div className="pointer-events-none absolute top-[84px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-amber-300 text-[10px] font-bold border border-amber-400/40 shadow-xs flex items-center gap-1 opacity-90 transition-opacity">
          <span>🔥</span>
          <span>Bosing</span>
        </div>
      )}
    </div>
  );
};
