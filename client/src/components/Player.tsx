import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface PlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
}

export default function Player({ 
  src, 
  poster, 
  className = "w-full", 
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  onPlay, 
  onPause,
  onEnded,
  onError 
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // HLS streaming (.m3u8 files)
    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest loaded, ready to play");
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error, cannot recover");
              hls.destroy();
              if (onError) onError(data);
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } 
    // Native playback for MP4, YouTube URLs, etc.
    else {
      video.src = src;
    }
  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline
      className={className}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onError={(e) => {
        console.error("Video playback error:", e);
        if (onError) onError(e);
      }}
    />
  );
}
