"use client";

import { useEffect, useState, useRef } from "react";

export default function WhatsAppButton() {
  const phoneNumber = "918708886307";
  const message = "Hello, I need support with my subscription.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false); // NEW: tracks if drag happened
  const [hidden, setHidden] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const btnRef = useRef<HTMLAnchorElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startCoords = useRef({ x: 0, y: 0 }); // NEW: initial pointer coords
  const idleTimer = useRef<any>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      const isMobile = window.innerWidth < 600;
      setPos({
        x: window.innerWidth - (isMobile ? 60 : 80),
        y: window.innerHeight - (isMobile ? 80 : 100),
      });
    } else {
      // Clamp on resize
      const btnSize = viewport.width < 600 ? 52 : viewport.width < 1024 ? 60 : 68;
      setPos(prev => ({
        x: Math.min(prev.x, viewport.width - btnSize - 10),
        y: Math.min(prev.y, viewport.height - btnSize - 10)
      }));
    }
  }, [viewport]);

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (!isDragging || !btnRef.current) return;

      const dx = Math.abs(clientX - startCoords.current.x);
      const dy = Math.abs(clientY - startCoords.current.y);

      if (dx > 5 || dy > 5) {
        setDragged(true); // movement detected → mark as drag
      }

      let newX = clientX - dragOffset.current.x;
      let newY = clientY - dragOffset.current.y;

      const btnSize = btnRef.current.offsetWidth || 60;
      const vw = viewport.width - btnSize;
      const vh = viewport.height - btnSize;

      newX = Math.max(10, Math.min(newX, vw - 10));
      newY = Math.max(10, Math.min(newY, vh - 10));

      setPos({ x: newX, y: newY });
    };

    const mouseMove = (e: MouseEvent) => updatePosition(e.clientX, e.clientY);
    const touchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };

    const stop = () => {
      setIsDragging(false);
      setTimeout(() => setDragged(false), 100); // reset drag flag shortly after drop
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("touchmove", touchMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, [isDragging, viewport]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!btnRef.current) return;
    e.preventDefault();

    const rect = btnRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    startCoords.current = { x: clientX, y: clientY }; // save initial coordinates

    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    setIsDragging(true);
    setDragged(false); // reset drag state
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (dragged) {
      e.preventDefault(); // prevent click navigation if this was a drag-drop
    }
  };

  useEffect(() => {
    const scroll = () => {
      setHidden(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setHidden(false), 2000);
    };

    window.addEventListener("scroll", scroll);
    return () => window.removeEventListener("scroll", scroll);
  }, []);

  if (!hasMounted.current) return null;

  const btnSize = viewport.width < 600 ? 52 : viewport.width < 1024 ? 60 : 68;
  const iconSize = btnSize * 0.55; // NEW: icon now scales relative to button size
  const tooltipOffset = btnSize + 12;

  return (
    <a
      ref={btnRef}
      href={url}
      onClick={handleNavigate}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      target="_blank"
      rel="noopener noreferrer"
      className="group z-50 flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: btnSize,
        height: btnSize,
        backgroundColor: "#25D366", // still green
        opacity: hidden && !isDragging ? 0 : 1,
        transform: hidden && !isDragging ? "scale(0.65)" : "scale(1)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
      aria-label="Chat on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        fill="white"
        style={{ width: iconSize, height: iconSize }}
      >
        <path d="M20.52 3.48A11.74 11.74 0 0012 0C5.42 0 0 5.42 0 12a11.64 11.64 0 001.57 5.9L0 24l6.25-1.64A11.74 11.74 0 0012 24c6.58 0 12-5.42 12-12a11.74 11.74 0 00-3.48-8.52zM12 21.8c-1.79 0-3.53-.48-5.06-1.38l-.36-.22-3.71.97.99-3.62-.23-.37A9.44 9.44 0 012.2 12c0-5.35 4.35-9.8 9.8-9.8a9.66 9.66 0 016.93 2.87A9.66 9.66 0 0121.8 12c0 5.45-4.45 9.8-9.8 9.8zm5.44-7.16c-.3-.15-1.79-.89-2.07-.99-.27-.1-.47-.15-.67.15-.2.3-.79.99-.97 1.2-.17.2-.34.23-.64.08-1.26-.63-2.08-1.13-2.91-2.57-.22-.38.22-.35.65-1.19.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.5-.5-.67-.51h-.57c-.2 0-.5.08-.77.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.21 3.07c1.72 2.6 3.98 4.1 6.84 5.26.68.29 1.2.24 1.64.15.5-.07 1.79-.73 2.05-1.43.27-.7.27-1.3.2-1.43-.08-.13-.27-.2-.57-.35z" />
      </svg>

      <span
        className="absolute bg-black text-white text-xs sm:text-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
        style={{ right: tooltipOffset }}
      >
        Support
      </span>
    </a>
  );
}
