"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  hue: number;
  opacity: number;
}

interface DiamondIntroProps {
  onComplete: () => void;
}

function createParticles(width: number, height: number, count: number): Particle[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI;
    const speed = 2.5 + Math.random() * 7;
    particles.push({
      x: centerX,
      y: centerY,
      z: Math.random() * 400 - 200,
      vx: Math.cos(angle) * Math.cos(elevation) * speed,
      vy: Math.sin(angle) * Math.cos(elevation) * speed,
      vz: Math.sin(elevation) * speed,
      size: 3 + Math.random() * 9,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      hue: 42 + Math.random() * 20,
      opacity: 1
    });
  }
  return particles;
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  perspective: number
) {
  const scale = perspective / (perspective + p.z);
  const sx = p.x * scale + (ctx.canvas.width * (1 - scale)) / 2;
  const sy = p.y * scale + (ctx.canvas.height * (1 - scale)) / 2;
  const size = p.size * scale;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = Math.max(p.opacity * scale, 0);

  const gradient = ctx.createLinearGradient(-size, -size, size, size);
  gradient.addColorStop(0, `hsla(${p.hue}, 85%, 88%, 1)`);
  gradient.addColorStop(0.45, `hsla(${p.hue}, 75%, 62%, 1)`);
  gradient.addColorStop(1, `hsla(${p.hue - 5}, 65%, 35%, 1)`);

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.72, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.72, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.shadowColor = "rgba(212,175,55,0.9)";
  ctx.shadowBlur = 14 * scale;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.restore();
}

export default function DiamondIntro({ onComplete }: DiamondIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    const particles = createParticles(width, height, 140);
    const perspective = 600;
    let animationFrame = 0;
    let frameCount = 0;

    const animate = () => {
      frameCount += 1;
      ctx.clearRect(0, 0, width, height);

      particles
        .slice()
        .sort((a, b) => b.z - a.z)
        .forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.vz *= 0.985;
          p.rotation += p.rotationSpeed;
          if (frameCount > 70) {
            p.opacity -= 0.018;
          }
          drawDiamond(ctx, p, perspective);
        });

      if (frameCount < 220) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    const logoTimer = setTimeout(() => setShowLogo(true), 550);
    const fadeTimer = setTimeout(() => setFadeOut(true), 2900);
    const completeTimer = setTimeout(() => onComplete(), 3500);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      clearTimeout(logoTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!fadeOut ? (
        <motion.div
          key="intro"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-onyx"
        >
          <canvas ref={canvasRef} className="absolute inset-0" />

          <div className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-gold-radial animate-pulse-glow" />

          {showLogo && (
            <motion.div
              initial={{ opacity: 0, rotateY: -180, scale: 0.6 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1000 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="gold-shimmer-sweep relative h-40 w-40 overflow-hidden rounded-full border-2 border-imperial shadow-gold-lg sm:h-48 sm:w-48">
                <Image
                  src="/logo.jpg"
                  alt="Khodiyar Diamonds"
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                />
              </div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-6 font-heading text-xs uppercase tracking-[0.5em] text-champagne/80"
              >
                Trust &middot; Purity &middot; Brilliance
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
