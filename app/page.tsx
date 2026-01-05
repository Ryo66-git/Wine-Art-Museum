"use client";

import { useState, useEffect } from "react";
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
        <div className="py-4 md:py-6 text-center pointer-events-auto">
          <h1 className="text-3xl md:text-4xl font-serif tracking-wider text-white/95">
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

      {/* Gallery - Horizontal Scrolling */}
      {wineLabels.length > 0 && (
        <div className="pt-20 sm:pt-24 pb-4 sm:pb-8 h-screen flex flex-col">
          {/* Scrolling Gallery Container */}
          <div className="relative overflow-hidden flex-1 flex items-center">
            <div className="flex animate-scroll">
              {/* First set of images */}
              {wineLabels.map((label, index) => (
                <motion.div
                  key={`first-${label.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  className="flex-shrink-0 w-[200px] sm:w-[250px] md:w-[300px] lg:w-[350px] mx-1.5 sm:mx-2 md:mx-3 cursor-pointer group touch-manipulation"
                  onClick={() => setSelectedImage(label)}
                >
                  <div className="relative h-[240px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                    <Image
                      src={label.imageUrl}
                      alt={formatPrompt(label.prompt)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                      unoptimized
                      priority={index < 3}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transform translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500">
                      <p className="text-white/90 font-serif text-[10px] sm:text-xs italic leading-relaxed">
                        {formatPrompt(label.prompt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Duplicate set for seamless loop */}
              {wineLabels.map((label, index) => (
                <motion.div
                  key={`second-${label.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: (wineLabels.length + index) * 0.1,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  className="flex-shrink-0 w-[200px] sm:w-[250px] md:w-[300px] lg:w-[350px] mx-1.5 sm:mx-2 md:mx-3 cursor-pointer group touch-manipulation"
                  onClick={() => setSelectedImage(label)}
                >
                  <div className="relative h-[240px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-black/30 border border-white/5 group-hover:border-white/20 active:border-white/30 transition-all duration-500">
                    <Image
                      src={label.imageUrl}
                      alt={formatPrompt(label.prompt)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 group-active:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transform translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500">
                      <p className="text-white/90 font-serif text-[10px] sm:text-xs italic leading-relaxed">
                        {formatPrompt(label.prompt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Generate Button - Below Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center mt-3 sm:mt-4 mb-3 sm:mb-4 px-4"
          >
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="min-h-[44px] px-6 sm:px-8 py-3 sm:py-4 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 hover:border-white/20 active:border-white/30 rounded-sm font-serif text-[11px] sm:text-xs md:text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            >
              {isLoading ? "Curating..." : "Curate New Piece"}
            </button>
          </motion.div>
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
