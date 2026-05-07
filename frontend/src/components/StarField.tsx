import { useEffect, useRef } from "react";

/**
 * Canvas-based star field background with twinkling stars and
 * occasional shooting stars. Fully responsive.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];

    interface Star {
      x: number;
      y: number;
      radius: number;
      baseOpacity: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
      color: string;
    }

    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      opacity: number;
      life: number;
      maxLife: number;
    }

    const STAR_COLORS = [
      "255, 255, 255",     // White
      "200, 220, 255",     // Blue-white
      "255, 240, 220",     // Warm white
      "180, 210, 255",     // Cool blue
      "0, 180, 255",       // Electric blue (accent)
    ];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      const count = Math.floor((canvas!.width * canvas!.height) / 2800);
      stars = [];
      for (let i = 0; i < count; i++) {
        const colorIdx = Math.random() < 0.08 ? 4 : Math.floor(Math.random() * 4);
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          radius: Math.random() * 1.4 + 0.2,
          baseOpacity: Math.random() * 0.6 + 0.2,
          opacity: 0,
          twinkleSpeed: Math.random() * 0.003 + 0.001,
          twinklePhase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[colorIdx],
        });
      }
    }

    function spawnShootingStar() {
      if (Math.random() > 0.003) return;
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      const speed = Math.random() * 6 + 4;
      shootingStars.push({
        x: Math.random() * canvas!.width * 0.8,
        y: Math.random() * canvas!.height * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 60 + 40,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 40 + 30,
      });
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw stars
      for (const star of stars) {
        star.opacity =
          star.baseOpacity +
          Math.sin(time * star.twinkleSpeed + star.twinklePhase) *
            star.baseOpacity *
            0.5;

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${star.color}, ${star.opacity})`;
        ctx!.fill();

        // Glow for brighter stars
        if (star.radius > 1) {
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          const gradient = ctx!.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.radius * 3
          );
          gradient.addColorStop(0, `rgba(${star.color}, ${star.opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(${star.color}, 0)`);
          ctx!.fillStyle = gradient;
          ctx!.fill();
        }
      }

      // Draw shooting stars
      spawnShootingStar();
      shootingStars = shootingStars.filter((ss) => {
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.opacity = 1 - ss.life / ss.maxLife;

        if (ss.opacity <= 0) return false;

        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx ** 2 + ss.vy ** 2)) * ss.length;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx ** 2 + ss.vy ** 2)) * ss.length;

        const gradient = ctx!.createLinearGradient(tailX, tailY, ss.x, ss.y);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.7, `rgba(0, 180, 255, ${ss.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(ss.x, ss.y);
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Head glow
        ctx!.beginPath();
        ctx!.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
        ctx!.fill();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
