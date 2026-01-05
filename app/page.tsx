"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface WineLabel {
  id: string;
  imageUrl: string;
  prompt: string;
}

export default function Home() {
  const [wineLabels, setWineLabels] = useState<WineLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<WineLabel | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isDragging, setIsDragging] = useState({ top: false, bottom: false });
  const dragStartRef = useRef({ x: 0, translateX: 0, hasMoved: false, row: '' as 'top' | 'bottom' | '' });
  const [topTranslateX, setTopTranslateX] = useState(0);
  const [bottomTranslateX, setBottomTranslateX] = useState(0);
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHeaderVisible(currentScrollY < 50 || currentScrollY < lastScrollY);
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Custom cursor effect
  useEffect(() => {
    const cursor = document.querySelector(".custom-cursor") as HTMLElement;
    if (!cursor) return;

    const updateCursor = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer") ||
        target.closest(".cursor-pointer")
      ) {
        cursor.classList.add("hover");
      } else {
        cursor.classList.remove("hover");
      }
    };

    window.addEventListener("mousemove", updateCursor);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // Global mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.top && !isDragging.bottom) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      
      if (Math.abs(deltaX) > 5) {
        dragStartRef.current.hasMoved = true;
      }

      if (isDragging.top) {
        setTopTranslateX(dragStartRef.current.translateX + deltaX * 2);
      } else if (isDragging.bottom) {
        setBottomTranslateX(dragStartRef.current.translateX + deltaX * 2);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.top || isDragging.bottom) {
        setIsDragging({ top: false, bottom: false });
        dragStartRef.current = { x: 0, translateX: 0, hasMoved: false, row: '' };
      }
    };

    if (isDragging.top || isDragging.bottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Drag handlers for top row
  const handleTopMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging({ top: true, bottom: false });
    dragStartRef.current = {
      x: e.clientX,
      translateX: topTranslateX,
      hasMoved: false,
      row: 'top',
    };
  };

  // Drag handlers for bottom row
  const handleBottomMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging({ top: false, bottom: true });
    dragStartRef.current = {
      x: e.clientX,
      translateX: bottomTranslateX,
      hasMoved: false,
      row: 'bottom',
    };
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate");
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned an invalid response. Please check the console for details.");
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.details || data.error || "Failed to generate image";
        throw new Error(errorMessage);
      }
      
      if (!data.imageUrl || !data.prompt) {
        throw new Error("Invalid response from server");
      }
      
      const newLabel: WineLabel = {
        id: Date.now().toString(),
        imageUrl: data.imageUrl,
        prompt: data.prompt,
      };
      setWineLabels((prev) => [newLabel, ...prev]);
    } catch (error: any) {
      console.error("Error generating image:", error);
      const errorMessage = error?.message || "Failed to generate image. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrompt = (prompt: string) => {
    return prompt.replace(
      "A high quality artistic wine label design, no text, ",
      ""
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-x-hidden">
      {/* Custom Cursor */}
      <div className="custom-cursor" />
      {/* Fixed Header - Fades on scroll */}
      <motion.header
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: headerVisible ? 1 : 0,
          y: headerVisible ? 0 : -20,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-sm pointer-events-none"
      >
        <div className="py-3 sm:py-4 md:py-6 text-center pointer-events-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-wider text-white/95">
            Wine Art Museum
          </h1>
        </div>
      </motion.header>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/90"
          >
            <motion.div
              className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/20 border-t-white/60 rounded-full mb-4 sm:mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/50 font-serif text-sm sm:text-base md:text-lg italic tracking-wide px-4 text-center"
            >
              Artist is dreaming...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery - Two Column Reverse Scrolling */}
      {wineLabels.length > 0 && (
        <div className="pt-8 sm:pt-12 md:pt-16 pb-2 sm:pb-4 md:pb-8 h-screen flex flex-col">
          {/* Two Column Scrolling Gallery Container */}
          <div className="relative overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Top Row - Scrolls Right to Left */}
            <div className="relative overflow-hidden flex-1 min-h-0">
              <div 
                className={`flex h-full items-center cursor-grab ${!isDragging.top ? 'animate-scroll-right' : ''}`}
                ref={topRowRef}
                onMouseDown={handleTopMouseDown}
                style={isDragging.top ? { transform: `translateX(${topTranslateX}px)`, animationPlayState: 'paused' } : { transform: `translateX(${topTranslateX}px)` }}
              >
                {/* First set of images */}
                {wineLabels.map((label, index) => (
                  <motion.div
                    key={`top-first-${label.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px] lg:w-[280px] mx-1 sm:mx-1.5 md:mx-2 cursor-pointer group touch-manipulation"
                    onClick={(e) => {
                      if (!dragStartRef.current.hasMoved) {
                        setSelectedImage(label);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[260px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                      <Image
                        src={label.imageUrl}
                        alt={formatPrompt(label.prompt)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                        unoptimized
                        priority={index < 2}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    </div>
                  </motion.div>
                ))}
                {/* Duplicate set for seamless loop */}
                {wineLabels.map((label, index) => (
                  <motion.div
                    key={`top-second-${label.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: (wineLabels.length + index) * 0.05,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px] lg:w-[280px] mx-1 sm:mx-1.5 md:mx-2 cursor-pointer group touch-manipulation"
                    onClick={(e) => {
                      if (!dragStartRef.current.hasMoved) {
                        setSelectedImage(label);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[260px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                      <Image
                        src={label.imageUrl}
                        alt={formatPrompt(label.prompt)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Generate Button - Between Rows */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center my-2 sm:my-3 md:my-4 px-4 flex-shrink-0"
            >
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="min-h-[36px] sm:min-h-[40px] md:min-h-[44px] px-4 sm:px-5 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3 lg:py-4 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 hover:border-white/20 active:border-white/30 rounded-sm font-serif text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
              >
                {isLoading ? "Curating..." : "Curate New Piece"}
              </button>
            </motion.div>

            {/* Bottom Row - Scrolls Left to Right */}
            <div className="relative overflow-hidden flex-1 min-h-0">
              <div 
                className={`flex h-full items-center cursor-grab ${!isDragging.bottom ? 'animate-scroll-left' : ''}`}
                ref={bottomRowRef}
                onMouseDown={handleBottomMouseDown}
                style={isDragging.bottom ? { transform: `translateX(${bottomTranslateX}px)`, animationPlayState: 'paused' } : { transform: `translateX(${bottomTranslateX}px)` }}
              >
                {/* First set of images */}
                {wineLabels.map((label, index) => (
                  <motion.div
                    key={`bottom-first-${label.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px] lg:w-[280px] mx-1 sm:mx-1.5 md:mx-2 cursor-pointer group touch-manipulation"
                    onClick={(e) => {
                      if (!dragStartRef.current.hasMoved) {
                        setSelectedImage(label);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[260px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                      <Image
                        src={label.imageUrl}
                        alt={formatPrompt(label.prompt)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    </div>
                  </motion.div>
                ))}
                {/* Duplicate set for seamless loop */}
                {wineLabels.map((label, index) => (
                  <motion.div
                    key={`bottom-second-${label.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: (wineLabels.length + index) * 0.05,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[220px] lg:w-[280px] mx-1 sm:mx-1.5 md:mx-2 cursor-pointer group touch-manipulation"
                    onClick={(e) => {
                      if (!dragStartRef.current.hasMoved) {
                        setSelectedImage(label);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-[140px] sm:h-[160px] md:h-[200px] lg:h-[260px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                      <Image
                        src={label.imageUrl}
                        alt={formatPrompt(label.prompt)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {wineLabels.length === 0 && !isLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center w-full max-w-md"
          >
            <p className="text-white/30 font-serif text-lg sm:text-xl md:text-2xl italic tracking-wide mb-6 sm:mb-8">
              No pieces curated yet.
            </p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              onClick={handleGenerate}
              disabled={isLoading}
              className="min-h-[44px] w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 hover:border-white/20 active:border-white/30 rounded-sm font-serif text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            >
              {isLoading ? "Curating..." : "Curate New Piece"}
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-8"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-7xl max-h-[95vh] sm:max-h-[90vh] w-full h-full flex flex-col">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 min-w-[44px] min-h-[44px] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-black/70 active:bg-black/90 hover:bg-black/90 border border-white/20 rounded-full transition-all duration-300 group touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white/90 group-hover:text-white group-active:text-white transition-colors" />
                </button>
                
                <div className="relative flex-1 flex items-center justify-center overflow-hidden mt-8 sm:mt-0">
                  <Image
                    src={selectedImage.imageUrl}
                    alt={formatPrompt(selectedImage.prompt)}
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                  />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 sm:mt-6 text-center px-4 pb-2 sm:pb-0"
                >
                  <p className="text-white/70 font-serif text-xs sm:text-sm md:text-base italic leading-relaxed max-w-3xl mx-auto">
                    {formatPrompt(selectedImage.prompt)}
                  </p>
                </motion.div>
        </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
