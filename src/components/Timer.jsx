import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  Coffee
} from 'lucide-react';
import './Timer.css';

// Sound alert using Web Audio API synthesis (100% browser native, no external assets needed)
function playBeepSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Melodic completion chime
    playTone(587.33, 0.0, 0.25); // D5
    playTone(739.99, 0.2, 0.25); // F#5
    playTone(880.00, 0.4, 0.4);  // A5
  } catch {
    // Audio context may require prior user interaction
  }
}

export default function Timer({ onBack }) {
  const [initialDuration, setInitialDuration] = useState(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Custom inputs
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);

  const timerRef = useRef(null);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);
    if (soundEnabled) {
      playBeepSound();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleComplete]);

  const handleStartPause = () => {
    if (timeLeft <= 0) {
      setTimeLeft(initialDuration);
      setIsCompleted(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(initialDuration);
  };

  const applyCustomDuration = (e) => {
    e.preventDefault();
    const total = Math.max(1, (parseInt(inputMinutes, 10) || 0) * 60 + (parseInt(inputSeconds, 10) || 0));
    setInitialDuration(total);
    setTimeLeft(total);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const applyPreset = (seconds) => {
    setInitialDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsCompleted(false);
    setInputMinutes(Math.floor(seconds / 60));
    setInputSeconds(seconds % 60);
  };

  // Format mm:ss or hh:mm:ss
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Progress percentage for SVG ring
  const progressPercent = initialDuration > 0
    ? Math.max(0, Math.min(100, (timeLeft / initialDuration) * 100))
    : 0;

  const strokeDashoffset = 100 - progressPercent;

  return (
    <section className="timer-page">
      <div className="timer-container">
        <button className="timer-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="timer-header">
          <div className="timer-icon-wrapper">
            <Clock size={28} />
          </div>
          <h1>Focus <span className="gradient-text">Timer.</span></h1>
          <p>Stay in flow with customizable countdown timers, Pomodoro presets, and audio chime.</p>
        </header>

        <div className="timer-card">
          {/* Top Options */}
          <div className="timer-top-bar">
            <button
              type="button"
              className={`timer-sound-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {isCompleted && (
              <div className="timer-complete-pill">
                <Bell size={15} /> Time is up!
              </div>
            )}
          </div>

          {/* Radial Countdown Display */}
          <div className="timer-dial-container">
            <svg className="timer-svg" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                className="timer-circle-bg"
                cx="50"
                cy="50"
                r="44"
                strokeWidth="5"
              />
              {/* Progress circle */}
              <circle
                className={`timer-circle-progress ${isCompleted ? 'completed' : ''}`}
                cx="50"
                cy="50"
                r="44"
                strokeWidth="5"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            <div className="timer-digits-overlay">
              <span className={`timer-digits ${isCompleted ? 'pulse' : ''}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="timer-status-sub">
                {isCompleted
                  ? 'Completed 🎉'
                  : isRunning
                  ? 'Counting down'
                  : timeLeft === initialDuration
                  ? 'Ready to start'
                  : 'Paused'}
              </span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="timer-main-actions">
            <button
              type="button"
              className={`timer-btn-primary ${isRunning ? 'pause' : 'start'}`}
              onClick={handleStartPause}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              <span>{isRunning ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Start'}</span>
            </button>

            <button
              type="button"
              className="timer-btn-secondary"
              onClick={handleReset}
              title="Reset to initial duration"
            >
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="timer-presets-section">
            <span className="presets-label">
              <Coffee size={14} /> Quick Presets:
            </span>
            <div className="presets-chips">
              {[
                { label: '1 min', sec: 60 },
                { label: '5 min', sec: 300 },
                { label: '10 min', sec: 600 },
                { label: '15 min', sec: 900 },
                { label: '25 min (Pomodoro)', sec: 1500 },
                { label: '45 min', sec: 2700 }
              ].map((p) => (
                <button
                  key={p.sec}
                  type="button"
                  className={`preset-chip ${initialDuration === p.sec && !isRunning ? 'active' : ''}`}
                  onClick={() => applyPreset(p.sec)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration Form */}
          <form className="timer-custom-form" onSubmit={applyCustomDuration}>
            <span className="custom-label">
              <Sparkles size={14} /> Set Custom Time:
            </span>
            <div className="custom-inputs-row">
              <div className="custom-field">
                <input
                  type="number"
                  min="0"
                  max="599"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  className="custom-time-input"
                  aria-label="Minutes"
                />
                <span>min</span>
              </div>
              <span className="colon">:</span>
              <div className="custom-field">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(e.target.value)}
                  className="custom-time-input"
                  aria-label="Seconds"
                />
                <span>sec</span>
              </div>
              <button type="submit" className="custom-set-btn">
                Set Time
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

