/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pen,
  Eraser,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  LogOut,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface SavedArtwork {
  dataUrl: string;
  savedAt: string;
  updatedTimestamp: number;
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('monocanvas_current_user') || null;
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Canvas & Tooling State (STRICTLY ONLY 2 TOOLS: 'pen' and 'eraser')
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [penSize, setPenSize] = useState<number>(4);
  const [eraserSize, setEraserSize] = useState<number>(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Single Drawing per account storage state
  const [savedArtwork, setSavedArtwork] = useState<SavedArtwork | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Toast notification
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Sync saved artwork when user changes
  useEffect(() => {
    if (currentUser) {
      const stored = localStorage.getItem(`monocanvas_slot_${currentUser}`);
      if (stored) {
        try {
          const parsed: SavedArtwork = JSON.parse(stored);
          setSavedArtwork(parsed);
        } catch {
          setSavedArtwork(null);
        }
      } else {
        setSavedArtwork(null);
      }
    } else {
      setSavedArtwork(null);
    }
  }, [currentUser]);

  // Canvas Initialization & Resizing
  const initBlankCanvas = useCallback((width: number, height: number, restoreDataUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Blank white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (restoreDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const initialSnap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current = [initialSnap];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      };
      img.src = restoreDataUrl;
    } else {
      const initialSnap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [initialSnap];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, []);

  // Resize listener
  useEffect(() => {
    if (!currentUser) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const currentW = parseInt(canvas.style.width || '0', 10);
          const currentH = parseInt(canvas.style.height || '0', 10);
          if (Math.abs(currentW - width) > 5 || Math.abs(currentH - height) > 5) {
            initBlankCanvas(Math.floor(width), Math.floor(height));
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [currentUser, initBlankCanvas]);

  // Push Canvas snapshot to history stack
  const pushHistorySnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snap);

    if (nextHistory.length > 25) {
      nextHistory.shift();
    }

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current -= 1;
    const targetSnapshot = historyRef.current[historyIndexRef.current];
    if (targetSnapshot) {
      ctx.putImageData(targetSnapshot, 0, 0);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current += 1;
    const targetSnapshot = historyRef.current[historyIndexRef.current];
    if (targetSnapshot) {
      ctx.putImageData(targetSnapshot, 0, 0);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Drawing event handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = currentTool === 'pen' ? penSize : eraserSize;
    ctx.lineWidth = size;
    ctx.strokeStyle = currentTool === 'pen' ? '#0f172a' : '#ffffff';

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e) {
      e.preventDefault();
    }
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = currentTool === 'pen' ? penSize : eraserSize;
    ctx.lineWidth = size;
    ctx.strokeStyle = currentTool === 'pen' ? '#0f172a' : '#ffffff';

    if (lastPointRef.current) {
      const midX = (lastPointRef.current.x + coords.x) / 2;
      const midY = (lastPointRef.current.y + coords.y) / 2;
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    } else {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    lastPointRef.current = coords;
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    pushHistorySnapshot();
  };

  // Clear Canvas (Reset to blank)
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = parseInt(canvas.style.width || '800', 10);
    const height = parseInt(canvas.style.height || '500', 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    pushHistorySnapshot();
    showToast('Canvas cleared to blank.');
  };

  // Save drawing: strictly 1 drawing per user account
  const handleSaveToAccount = () => {
    if (!currentUser) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const artworkObj: SavedArtwork = {
      dataUrl,
      savedAt: formattedDate,
      updatedTimestamp: Date.now(),
    };

    localStorage.setItem(`monocanvas_slot_${currentUser}`, JSON.stringify(artworkObj));
    setSavedArtwork(artworkObj);
    showToast('Saved! Your single account artwork slot has been updated.');
  };

  // Load the user's saved drawing
  const handleLoadSavedArtwork = () => {
    if (!savedArtwork) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = parseInt(canvas.style.width || '800', 10);
    const height = parseInt(canvas.style.height || '500', 10);
    initBlankCanvas(width, height, savedArtwork.dataUrl);
    showToast(`Loaded your saved artwork from ${savedArtwork.savedAt}.`);
  };

  // Download drawing as PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `monocanvas-${currentUser ? currentUser.split('@')[0] : 'artwork'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Drawing downloaded as PNG.');
  };










  // Authentication Handler: straightforward sign in to user's canvas space
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    if (!email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (password.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    // Check account record in storage
    const usersRaw = localStorage.getItem('monocanvas_user_db') || '{}';
    let usersDb: Record<string, string> = {};
    try {
      usersDb = JSON.parse(usersRaw);
    } catch {
      usersDb = {};
    }

    if (usersDb[email] && usersDb[email] !== password) {
      setAuthError('Invalid password. Please check your credentials.');
      return;
    }

    // Save/validate credentials for this email
    usersDb[email] = password;
    localStorage.setItem('monocanvas_user_db', JSON.stringify(usersDb));
    localStorage.setItem('monocanvas_current_user', email);

    setCurrentUser(email);
    setEmailInput('');
    setPasswordInput('');
    showToast(`Welcome, ${email}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('monocanvas_current_user');
    setCurrentUser(null);
    setSavedArtwork(null);
    showToast('Logged out successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar Navigation (Only shown when logged in as requested) */}
      {currentUser && (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              M
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">
              MonoCanvas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-slate-700 font-medium truncate max-w-[180px]">
                {currentUser}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                {savedArtwork ? '1/1 Saved' : '0/1 Slot'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Log out of account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* VIEW 1: CLEAN SIGN IN (No top bar, no subtext, no authorized accounts footer) */}
        {!currentUser ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Sign In
                </h1>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        ) : (










          /* VIEW 2: AUTHENTICATED CANVAS STUDIO (Separated by 10 empty lines) */
          <div className="flex-1 flex flex-col p-4 md:p-6 max-w-6xl w-full mx-auto min-h-0">
            {/* Top Studio Controls Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* PRIMARY TOOLS: STRICTLY ONLY 2 TOOLS (PEN & ERASER) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {/* Tool 1: Pen */}
                  <button
                    type="button"
                    onClick={() => setCurrentTool('pen')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      currentTool === 'pen'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Pen className="w-3.5 h-3.5" />
                    <span>Pen (قلم)</span>
                  </button>

                  {/* Tool 2: Eraser */}
                  <button
                    type="button"
                    onClick={() => setCurrentTool('eraser')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      currentTool === 'eraser'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Eraser (ممحاة)</span>
                  </button>
                </div>

                {/* Tool Size Slider */}
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <span className="font-medium text-slate-700">
                    {currentTool === 'pen' ? 'Pen Size:' : 'Eraser Size:'}
                  </span>
                  <input
                    type="range"
                    min={currentTool === 'pen' ? '1' : '8'}
                    max={currentTool === 'pen' ? '24' : '60'}
                    value={currentTool === 'pen' ? penSize : eraserSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (currentTool === 'pen') {
                        setPenSize(val);
                      } else {
                        setEraserSize(val);
                      }
                    }}
                    className="w-20 accent-slate-900 cursor-pointer"
                  />
                  <span className="font-mono tabular-nums text-slate-900 font-semibold w-7 text-right">
                    {currentTool === 'pen' ? `${penSize}px` : `${eraserSize}px`}
                  </span>
                </div>
              </div>

              {/* History & Canvas Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Undo stroke"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Redo stroke"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Clear canvas to blank"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Storage & Export Actions */}
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Download drawing as PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {savedArtwork && (
                  <button
                    type="button"
                    onClick={handleLoadSavedArtwork}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Load saved artwork from account"
                  >
                    <span>Load Saved</span>
                  </button>
                )}

                {/* STRICTLY 1 DRAWING PER ACCOUNT SAVE BUTTON */}
                <button
                  type="button"
                  onClick={handleSaveToAccount}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Save or overwrite the single artwork slot for this account"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Artwork (1 Slot)</span>
                </button>
              </div>
            </div>

            {/* Drawing Surface Container */}
            <div
              ref={containerRef}
              className="flex-1 w-full min-h-[460px] bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs relative flex items-center justify-center select-none"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="touch-none block"
                style={{
                  cursor: currentTool === 'pen' ? 'crosshair' : 'cell',
                }}
              />
            </div>

            {/* Bottom Status & Slot Details */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tools Available:
                </span>
                <span>Only 2 (Pen & Eraser)</span>
                <span className="text-slate-300">·</span>
                <span>Active: <strong className="text-slate-800 capitalize">{currentTool}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Account Storage:</span>
                {savedArtwork ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    1/1 Artwork Saved ({savedArtwork.savedAt})
                  </span>
                ) : (
                  <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    0/1 Slot Used (No drawing saved yet)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
