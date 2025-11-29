import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Camera, MapPin, Compass } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"init" | "loading" | "complete">("init");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("loading"), 100);
    const timer2 = setTimeout(() => setPhase("complete"), duration - 400);
    const timer3 = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {phase !== "complete" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="relative flex flex-col items-center gap-8">
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Crosshair className="w-32 h-32 text-primary/20" strokeWidth={0.5} />
              </motion.div>
              
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-24 h-24 border border-primary/30 rounded-full" />
              </motion.div>
              
              <motion.div
                className="relative z-10 flex items-center justify-center w-32 h-32"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-16 h-16 bg-primary/10 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </div>
                <Camera className="w-12 h-12 text-primary reticle-glow" strokeWidth={1.5} />
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1 className="text-xl font-semibold tracking-wider text-foreground">
                CAMERA ZERODAY
              </h1>
              <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
                Tactical Photo System
              </p>
            </motion.div>

            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.div
                className="flex items-center gap-1.5 text-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono">GPS</span>
              </motion.div>
              
              <motion.div
                className="flex items-center gap-1.5 text-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              >
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono">ORIENT</span>
              </motion.div>
              
              <motion.div
                className="flex items-center gap-1.5 text-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                <Crosshair className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono">RETICLE</span>
              </motion.div>
            </motion.div>

            <motion.div
              className="w-48 h-0.5 bg-muted rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: (duration - 1000) / 1000, 
                  ease: "easeInOut",
                  delay: 0.8
                }}
              />
            </motion.div>

            <motion.div
              className="absolute -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.2 }}
            >
              <svg 
                className="w-80 h-80 text-primary/5" 
                viewBox="0 0 100 100"
                strokeWidth={0.2}
                stroke="currentColor"
                fill="none"
              >
                <circle cx="50" cy="50" r="45" />
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="25" />
                <line x1="50" y1="5" x2="50" y2="20" />
                <line x1="50" y1="80" x2="50" y2="95" />
                <line x1="5" y1="50" x2="20" y2="50" />
                <line x1="80" y1="50" x2="95" y2="50" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
