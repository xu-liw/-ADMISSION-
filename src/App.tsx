/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

const TOTAL_SLIDES = 7;
const END_BG = '/slide-7.png';
const INSTAGRAM_URL = 'https://www.instagram.com/xu_liw/';
const YOUTUBE_URL = 'https://www.youtube.com/@liwei180';
const TITLE = 'ADMISSION';

export default function App() {
  // 檢查是否為手機直立狀態（非手機或手機橫躺時為 false）
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === 'undefined') return true;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isPhoneWidth = window.innerWidth <= 520;
    return isPortrait && isPhoneWidth;
  });

  // 當前中心頁面索引：0 ~ 6（對應第 1 ~ 7 頁）
  const [currentIndex, setCurrentIndex] = useState(0);

  // 拖動與動畫位移（單位：px）
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 首頁滑動提示（2 秒自動平滑淡出）
  const [hintVisible, setHintVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelLockRef = useRef(false);

  // 監聽螢幕寬高與方向變化
  useEffect(() => {
    const handleResizeOrOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isPhoneWidth = window.innerWidth <= 520;
      setIsMobilePortrait(isPortrait && isPhoneWidth);
    };

    handleResizeOrOrientation();
    window.addEventListener('resize', handleResizeOrOrientation);
    window.addEventListener('orientationchange', handleResizeOrOrientation);
    return () => {
      window.removeEventListener('resize', handleResizeOrOrientation);
      window.removeEventListener('orientationchange', handleResizeOrOrientation);
    };
  }, []);

  // 首頁提示：出現 2 秒後自動平滑淡出
  useEffect(() => {
    const timer = setTimeout(() => {
      setHintVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 確保網頁標題為 ADMISSION
  useEffect(() => {
    document.title = TITLE;
  }, []);

  // 提示訊息 Toast
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, []);

  // 滑向下一頁（向左滑動）
  const nextSlide = useCallback(() => {
    if (isAnimatingRef.current) return;
    setHintVisible(false);
    isAnimatingRef.current = true;
    setIsTransitioning(true);

    const width = containerRef.current?.clientWidth || window.innerWidth;
    setDragOffset(-width);

    setTimeout(() => {
      setIsTransitioning(false);
      setDragOffset(0);
      currentOffsetRef.current = 0;
      setCurrentIndex((prev) => (prev + 1) % TOTAL_SLIDES);
      isAnimatingRef.current = false;
    }, 550);
  }, []);

  // 滑向上一頁（向右滑動）
  const prevSlide = useCallback(() => {
    if (isAnimatingRef.current) return;
    setHintVisible(false);
    isAnimatingRef.current = true;
    setIsTransitioning(true);

    const width = containerRef.current?.clientWidth || window.innerWidth;
    setDragOffset(width);

    setTimeout(() => {
      setIsTransitioning(false);
      setDragOffset(0);
      currentOffsetRef.current = 0;
      setCurrentIndex((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
      isAnimatingRef.current = false;
    }, 550);
  }, []);

  // 觸控/滑鼠拖曳開始
  const handlePointerDown = (clientX: number) => {
    if (isAnimatingRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startTimeRef.current = Date.now();
    currentOffsetRef.current = 0;
    setDragOffset(0);
    setIsTransitioning(false);
  };

  // 觸控/滑鼠拖曳移動
  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current || isAnimatingRef.current) return;
    const deltaX = clientX - startXRef.current;
    currentOffsetRef.current = deltaX;
    setDragOffset(deltaX);

    if (Math.abs(deltaX) > 15) {
      setHintVisible(false);
    }
  };

  // 觸控/滑鼠拖曳結束
  const handlePointerUp = () => {
    if (!isDraggingRef.current || isAnimatingRef.current) return;
    isDraggingRef.current = false;

    const deltaX = currentOffsetRef.current;
    const elapsedTime = Date.now() - startTimeRef.current;
    const width = containerRef.current?.clientWidth || window.innerWidth;

    const isFlick = elapsedTime < 250 && Math.abs(deltaX) > 30;
    const isSwipeDistance = Math.abs(deltaX) > width * 0.16;

    if (deltaX < 0 && (isFlick || isSwipeDistance)) {
      nextSlide();
    } else if (deltaX > 0 && (isFlick || isSwipeDistance)) {
      prevSlide();
    } else {
      setIsTransitioning(true);
      setDragOffset(0);
      currentOffsetRef.current = 0;
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    }
  };

  // 鍵盤左右鍵切換
  useEffect(() => {
    if (!isMobilePortrait) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isMobilePortrait]);

  // 滑鼠滾輪/觸控板水平平滑翻頁
  useEffect(() => {
    if (!isMobilePortrait) return;
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 25 || wheelLockRef.current) return;

      wheelLockRef.current = true;
      if (delta > 0) {
        nextSlide();
      } else {
        prevSlide();
      }

      setTimeout(() => {
        wheelLockRef.current = false;
      }, 600);
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [nextSlide, prevSlide, isMobilePortrait]);

  // 原生系統分享（確保視窗名稱為 ADMISSION）
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }

    const shareUrl = window.location.href;
    const shareData = {
      title: TITLE,
      text: TITLE,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('連結已複製至剪貼簿'))
        .catch(() => execCopyFallback(text));
    } else {
      execCopyFallback(text);
    }
  };

  const execCopyFallback = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('連結已複製至剪貼簿');
    } catch {
      showToast('請直接複製網址');
    }
  };

  // 渲染單個頁面（0 ~ 6 對應 slide 1 ~ 7）
  const renderSlideItem = (slideIdx: number, isCenter: boolean) => {
    const idx = ((slideIdx % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;

    // 索引 6 是第 7 頁（資訊頁）
    if (idx === 6) {
      return (
        <div
          key="slide-end"
          className="w-screen h-screen h-[100dvh] relative flex items-center justify-center overflow-hidden bg-black select-none shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <img
            src={END_BG}
            alt=""
            className="absolute inset-0 w-full h-full object-cover block pointer-events-none select-none z-0"
          />

          <div className="relative z-10 flex items-center justify-center gap-6">
            <button
              onClick={handleShare}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white glass-btn cursor-pointer outline-none select-none"
              title="分享"
              aria-label="分享"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
              </svg>
            </button>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full flex items-center justify-center text-white glass-btn cursor-pointer outline-none select-none"
              title="Instagram"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full flex items-center justify-center text-white glass-btn cursor-pointer outline-none select-none"
              title="YouTube"
              aria-label="YouTube"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      );
    }

    // 索引 0 ~ 5 是第 1 ~ 6 頁
    const imgSrc = `/slide-${idx + 1}.png`;
    return (
      <div
        key={`slide-${idx + 1}`}
        className="w-screen h-screen h-[100dvh] relative flex items-center justify-center bg-black overflow-hidden select-none shrink-0"
      >
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover block pointer-events-none select-none"
        />

        {/* 第 1 頁（idx === 0）手勢提示 */}
        {idx === 0 && (
          <div
            className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white pointer-events-none z-20"
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              opacity: hintVisible && isCenter ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            aria-hidden="true"
          >
            <div className="w-6 h-6 flex items-center justify-center animate-arrow">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 block"
                style={{ display: 'block', margin: 'auto' }}
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 當非手機或手機橫躺時，不顯示作品集，改以 slide-7 為背景並顯示白色提示字
  if (!isMobilePortrait) {
    return (
      <div className="fixed inset-0 w-screen h-screen h-[100dvh] bg-black flex items-center justify-center overflow-hidden select-none">
        {/* 背景 slide-7.png */}
        <img
          src={END_BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover block pointer-events-none select-none z-0"
        />

        {/* 微微毛玻璃暗色遮罩 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 pointer-events-none"></div>

        {/* 白色字：Please use phones vertically. */}
        <div className="relative z-20 text-center px-6">
          <p className="text-white text-base md:text-lg font-light tracking-wider drop-shadow-md">
            Please use phones vertically.
          </p>
        </div>
      </div>
    );
  }

  const prevIndex = (currentIndex - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
  const nextIndex = (currentIndex + 1) % TOTAL_SLIDES;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen h-[100dvh] bg-black text-white overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
    >
      {/* 3 面板動態閉環軌道 */}
      <div
        className="h-full flex flex-row"
        style={{
          width: '300vw',
          transform: `translate3d(calc(-100vw + ${dragOffset}px), 0, 0)`,
          transition: isTransitioning
            ? 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
          willChange: 'transform',
        }}
      >
        {/* 左側面板：上一頁 */}
        {renderSlideItem(prevIndex, false)}

        {/* 中央面板：當前頁 */}
        {renderSlideItem(currentIndex, true)}

        {/* 右側面板：下一頁 */}
        {renderSlideItem(nextIndex, false)}
      </div>

      {/* 毛玻璃 Toast 提示 */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide text-white bg-neutral-900/90 border border-white/20 backdrop-blur-xl shadow-2xl transition-all duration-300 pointer-events-none ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {toastMessage}
      </div>
    </div>
  );
}
