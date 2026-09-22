import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Activity,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

interface FairnessReplayProps {
  queueId?: string;
}

export const FairnessReplay: React.FC<FairnessReplayProps> = ({ queueId }) => {
  const [frames, setFrames] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .getFairnessReplay(queueId)
      .then((res) => {
        setFrames(res.frames || []);
        setCurrentIndex(0);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [queueId]);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying && frames.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, frames.length]);

  const handlePlayPause = () => {
    if (currentIndex >= frames.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(frames.length - 1, prev + 1));
  };

  const currentFrame = frames[currentIndex] || null;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading historical queue replay frames...
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No recorded queue events available to replay yet. Join queues and begin servicing to populate replay telemetry.
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900 text-white p-6 border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Queue Evolution Replay</h3>
            <p className="text-xs text-slate-400">
              Visual frame-by-frame reconstruction of queue ordering decisions
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono font-bold text-brand-400">
            FRAME {currentIndex + 1} / {frames.length}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {currentFrame ? new Date(currentFrame.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
      </div>

      {/* Main Replay Stage */}
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Current Event */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Step Action
            </span>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-500 text-white">
                {currentFrame?.eventType}
              </span>
              <span className="text-sm font-mono font-bold text-slate-200">
                {currentFrame?.ticketNumber}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              {currentFrame?.reason || 'Queue reordered based on priority recalculation'}
            </p>
          </div>

          {/* Card: Position Change */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Position Shift
            </span>
            <div className="mt-2 flex items-center space-x-3">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">BEFORE</span>
                <span className="text-xl font-mono font-bold text-slate-400">
                  {currentFrame?.previousPosition !== null && currentFrame?.previousPosition !== undefined
                    ? `#${currentFrame.previousPosition}`
                    : 'N/A'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-400" />
              <div className="text-center">
                <span className="text-[10px] text-brand-400 block font-semibold">AFTER</span>
                <span className="text-2xl font-mono font-black text-brand-400">
                  {currentFrame?.newPosition !== null && currentFrame?.newPosition !== undefined
                    ? `#${currentFrame.newPosition}`
                    : 'Serving'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Reconstructed Queue Size */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Queue Size
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {currentFrame?.queueSizeAfter || 0}
              </span>
              <span className="text-xs text-slate-400">people waiting in line</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="space-y-2 pt-2">
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Start: {new Date(frames[0]?.timestamp).toLocaleTimeString()}</span>
          <span>End: {new Date(frames[frames.length - 1]?.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center space-x-4 pt-4">
        <button
          onClick={handleStepBack}
          disabled={currentIndex === 0}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          title="Step Back"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={handlePlayPause}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center space-x-2 shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          onClick={handleStepForward}
          disabled={currentIndex >= frames.length - 1}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          title="Step Forward"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentIndex(0);
          }}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Reset to Start"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
