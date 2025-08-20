"use client";

import * as React from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Trash2,
  X,
  AlertTriangle,
  Check,
  Loader2,
  RotateCcw,
  Skull,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const deleteButtonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group",
  {
    variants: {
      variant: {
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-lg hover:shadow-destructive/25 active:scale-95",
        ghost:
          "text-destructive hover:text-destructive-hover hover:bg-destructive/10 dark:hover:bg-destructive/20 active:scale-95",
        outline:
          "border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground hover:shadow-lg hover:shadow-destructive/25 active:scale-95",
        soft: "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/30 dark:text-destructive-foreground dark:hover:bg-destructive/50 active:scale-95",
        gradient:
          "bg-gradient-to-r from-destructive to-accent text-destructive-foreground hover:from-destructive-hover hover:to-accent-hover shadow-lg hover:shadow-destructive/30 active:scale-95",
        neon: "bg-background border border-destructive text-destructive hover:bg-destructive hover:text-background hover:shadow-[0_0_20px_rgba(var(--destructive-rgb),0.5)] transition-all duration-300 active:scale-95",
        brutal:
          "bg-destructive text-destructive-foreground border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(var(--foreground-rgb),1)] hover:shadow-[2px_2px_0px_0px_rgba(var(--foreground-rgb),1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100",
        minimal:
          "text-destructive hover:text-destructive-hover hover:bg-destructive/10 dark:hover:bg-destructive/10 rounded-full active:scale-90",
        danger:
          "bg-destructive-hover text-destructive-foreground hover:bg-destructive-active border-l-4 border-destructive-active shadow-inner active:scale-95",
      },
      size: {
        micro: "h-4 w-4 p-0", // 16px - ultra small
        tiny: "h-5 w-5 p-0", // 20px - very small
        xs: "h-6 px-2 text-xs gap-1",
        sm: "h-8 px-3 text-sm gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2.5",
        xl: "h-14 px-8 text-lg gap-3",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-6 w-6 p-0",
        "icon-xs": "h-5 w-5 p-0",
        "icon-micro": "h-4 w-4 p-0",
      },
      state: {
        idle: "",
        loading: "cursor-not-allowed",
        confirming: "animate-pulse",
        success: "bg-success hover:bg-success text-success-foreground",
        error:
          "bg-destructive-active hover:bg-destructive-active text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "destructive",
      size: "md",
      state: "idle",
    },
  }
);

const iconVariants = {
  trash: Trash2,
  x: X,
  skull: Skull,
  flame: Flame,
  zap: Zap,
};

interface DeleteButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof deleteButtonVariants> {
  icon?: keyof typeof iconVariants;
  confirmationRequired?: boolean;
  confirmationText?: string;
  loadingText?: string;
  successText?: string;
  onConfirm?: () => void | Promise<void>;
  showProgress?: boolean;
  undoable?: boolean;
  onUndo?: () => void;
  autoReset?: number;
  hapticFeedback?: boolean;
  soundEnabled?: boolean;
  iconSize?: number;
  loadingState?: boolean;
}

const DeleteButton = React.forwardRef<HTMLButtonElement, DeleteButtonProps>(
  (
    {
      children,
      className,
      size = "md",
      variant = "destructive",
      disabled,
      icon = "trash",
      confirmationRequired = false,
      confirmationText = "Delete",
      loadingText = "Deleting...",
      successText = "Deleted",
      onConfirm,
      onClick,
      showProgress = false,
      undoable = false,
      onUndo,
      autoReset = 3000,
      hapticFeedback = false,
      soundEnabled = false,
      iconSize,
      loadingState,
      ...props
    },
    ref
  ) => {
    const [state, setState] = React.useState<
      "idle" | "confirming" | "loading" | "success" | "error"
    >("idle");
    const [progress, setProgress] = React.useState(0);
    const [showUndo, setShowUndo] = React.useState(false);
    const progressRef = React.useRef<NodeJS.Timeout | null>(null);
    const resetRef = React.useRef<NodeJS.Timeout | null>(null);
    const undoRef = React.useRef<NodeJS.Timeout | null>(null);

    const IconComponent = iconVariants[icon];

    const getIconSize = () => {
      if (iconSize) return iconSize;

      switch (size) {
        case "micro":
        case "icon-micro":
          return 10;
        case "tiny":
        case "icon-xs":
          return 12;
        case "xs":
        case "icon-sm":
          return 14;
        case "sm":
        case "icon":
          return 16;
        case "md":
          return 18;
        case "lg":
          return 20;
        case "xl":
          return 24;
        default:
          return 16;
      }
    };

    const triggerHaptic = React.useCallback(() => {
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
    }, [hapticFeedback]);

    const playSound = React.useCallback(
      (type: "click" | "success" | "error") => {
        if (!soundEnabled) return;

        // Create audio context for sound effects
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext;
        if (!AudioContextClass) return;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
          case "click":
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            break;
          case "success":
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            break;
          case "error":
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            break;
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      },
      [soundEnabled]
    );

    const handleClick = React.useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || state === "loading" || loadingState) return;

        triggerHaptic();
        playSound("click");

        if (state === "success" && undoable && onUndo) {
          onUndo();
          setShowUndo(false);
          setState("idle");
          if (undoRef.current) clearTimeout(undoRef.current);
          return;
        }

        if (!confirmationRequired) {
          setState("loading");

          if (showProgress) {
            setProgress(0);
            progressRef.current = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 100) {
                  if (progressRef.current) clearInterval(progressRef.current);
                  return 100;
                }
                return prev + 2;
              });
            }, 20);
          }

          try {
            if (onConfirm) {
              await onConfirm();
            } else if (onClick) {
              await onClick(e);
            }

            setState("success");
            playSound("success");

            if (undoable) {
              setShowUndo(true);
              undoRef.current = setTimeout(() => {
                setShowUndo(false);
              }, autoReset);
            }

            if (autoReset > 0) {
              resetRef.current = setTimeout(() => {
                setState("idle");
                setProgress(0);
              }, autoReset);
            }
          } catch (error) {
            console.error("Delete operation failed:", error);
            setState("error");
            playSound("error");
            resetRef.current = setTimeout(() => {
              setState("idle");
              setProgress(0);
            }, 2000);
          }
        } else {
          if (state === "idle") {
            setState("confirming");
          } else if (state === "confirming") {
            setState("loading");

            try {
              if (onConfirm) {
                await onConfirm();
              } else if (onClick) {
                await onClick(e);
              }
              setState("success");
              playSound("success");
            } catch (error) {
              console.error("Delete operation failed:", error);
              setState("error");
              playSound("error");
            }
          }
        }
      },
      [
        state,
        disabled,
        loadingState,
        confirmationRequired,
        onConfirm,
        onClick,
        showProgress,
        undoable,
        onUndo,
        autoReset,
        triggerHaptic,
        playSound,
      ]
    );

    React.useEffect(() => {
      return () => {
        if (progressRef.current) clearInterval(progressRef.current);
        if (resetRef.current) clearTimeout(resetRef.current);
        if (undoRef.current) clearTimeout(undoRef.current);
      };
    }, []);

    const getButtonText = () => {
      if (children) return children;

      switch (state) {
        case "confirming":
          return confirmationText;
        case "loading":
          return loadingText;
        case "success":
          return undoable && showUndo ? "Undo" : successText;
        case "error":
          return "Error";
        default:
          return "Delete";
      }
    };

    const getIcon = () => {
      const iconProps = { size: getIconSize() };

      switch (loadingState ? "loading" : state) {
        case "loading":
          return <Loader2 className="animate-spin" {...iconProps} />;
        case "success":
          return undoable && showUndo ? (
            <RotateCcw {...iconProps} />
          ) : (
            <Check {...iconProps} />
          );
        case "error":
          return <AlertTriangle {...iconProps} />;
        case "confirming":
          return <AlertTriangle {...iconProps} />;
        default:
          return <IconComponent {...iconProps} />;
      }
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          deleteButtonVariants({ variant, size, state, className })
        )}
        onClick={handleClick}
        disabled={disabled || state === "loading" || loadingState}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Background effects */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          animate={{
            translateX: state === "loading" ? ["100%", "100%"] : "-100%",
          }}
          transition={{
            duration: state === "loading" ? 1.5 : 0,
            repeat: state === "loading" ? Number.POSITIVE_INFINITY : 0,
            ease: "linear",
          }}
        />

        {/* Progress bar */}
        {showProgress && state === "loading" && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="relative flex items-center justify-center"
              animate={{
                rotate: state === "confirming" ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: state === "confirming" ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: 1,
              }}
              whileHover="hover"
              initial="initial"
              variants={{
                initial: {},
                hover: {},
              }}
            >
              {/* Creative rounded background on hover */}
              <motion.div
                className="absolute inset-0 rounded-full bg-destructive/10" // Use theme destructive/10
                variants={{
                  initial: {
                    scale: 0,
                    opacity: 0,
                    borderRadius: "50%",
                  },
                  hover: {
                    scale:
                      variant === "minimal" || variant === "ghost" ? 1.4 : 1.2,
                    opacity:
                      variant === "minimal" || variant === "ghost" ? 0.8 : 0.3,
                    borderRadius: variant === "brutal" ? "20%" : "50%",
                  },
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />

              {/* Pulse effect for small sizes */}
              {(size === "micro" ||
                size === "tiny" ||
                size?.includes("icon")) && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-destructive/40" // Use theme destructive/40
                  variants={{
                    initial: {
                      scale: 0,
                      opacity: 0,
                    },
                    hover: {
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0],
                    },
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 0.5,
                  }}
                />
              )}

              {/* Icon with enhanced animations */}
              <motion.div
                className="relative z-10"
                variants={{
                  initial: {
                    scale: 1,
                    rotate: 0,
                  },
                  hover: {
                    scale: 1.1,
                    rotate: icon === "trash" ? -5 : icon === "flame" ? 10 : 0,
                  },
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {getIcon()}
              </motion.div>
            </motion.div>

            {size !== "icon" && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {getButtonText()}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-md"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: state === "success" ? 1.5 : 0, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)",
          }}
        />
      </motion.button>
    );
  }
);

DeleteButton.displayName = "DeleteButton";

export { DeleteButton };
