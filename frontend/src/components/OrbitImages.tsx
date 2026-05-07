import { useEffect, useRef, useState, type ReactNode } from "react";

interface OrbitItem {
  /** URL or element to display */
  content: string | ReactNode;
  /** Label shown on hover */
  label?: string;
}

interface OrbitImagesProps {
  /** Items to orbit */
  items: OrbitItem[];
  /** Horizontal radius in px */
  radiusX: number;
  /** Vertical radius in px */
  radiusY: number;
  /** Full orbit duration in seconds */
  duration: number;
  /** Size of each orbiting item in px */
  itemSize: number;
  /** Content to render at the center */
  centerContent?: ReactNode;
  /** Center element size in px */
  centerSize?: number;
  /** CSS class for the container */
  className?: string;
  /** Whether to show the orbit path */
  showOrbitPath?: boolean;
  /** Tilt angle in degrees for 3D perspective */
  tilt?: number;
  /** Starting angle offset in degrees */
  startAngle?: number;
  /** Orbit direction */
  reverse?: boolean;
  /** Opacity of items when behind (at the "back" of the ellipse) */
  backOpacity?: number;
}

export default function OrbitImages({
  items,
  radiusX,
  radiusY,
  duration,
  itemSize,
  centerContent,
  centerSize = 80,
  className = "",
  showOrbitPath = true,
  tilt = 65,
  startAngle = 0,
  reverse = false,
  backOpacity = 0.3,
}: OrbitImagesProps) {
  const [angles, setAngles] = useState<number[]>(() =>
    items.map((_, i) => startAngle + (360 / items.length) * i)
  );
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const degreesPerMs = (360 / (duration * 1000)) * (reverse ? -1 : 1);

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setAngles((prev) =>
        prev.map((angle) => (angle + degreesPerMs * delta) % 360)
      );

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, reverse]);

  const getPosition = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.cos(rad) * radiusX;
    const yFlat = Math.sin(rad) * radiusY;
    const tiltRad = (tilt * Math.PI) / 180;
    const y = yFlat * Math.cos(tiltRad);
    const z = yFlat * Math.sin(tiltRad);
    return { x, y, z };
  };

  // Sort items by z-index for proper layering
  const sortedItems = items
    .map((item, i) => ({ item, angle: angles[i], index: i }))
    .sort((a, b) => {
      const posA = getPosition(a.angle);
      const posB = getPosition(b.angle);
      return posA.z - posB.z;
    });

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: radiusX * 2 + itemSize,
        height: radiusY * 2 * Math.cos((tilt * Math.PI) / 180) + itemSize,
      }}
    >
      {/* Orbit path */}
      {showOrbitPath && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: radiusX * 2,
            height: radiusY * 2,
            border: "1px solid rgba(0, 180, 255, 0.07)",
            transform: `translate(-50%, -50%) rotateX(${tilt}deg)`,
          }}
        />
      )}

      {/* Center content */}
      {centerContent && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            width: centerSize,
            height: centerSize,
            zIndex: 50,
          }}
        >
          {centerContent}
        </div>
      )}

      {/* Orbiting items */}
      {sortedItems.map(({ item, angle, index }) => {
        const { x, y, z } = getPosition(angle);
        const maxZ = radiusY * Math.sin((tilt * Math.PI) / 180);
        const normalizedZ = (z + maxZ) / (2 * maxZ);
        const opacity = backOpacity + (1 - backOpacity) * normalizedZ;
        const scale = 0.6 + 0.4 * normalizedZ;

        return (
          <div
            key={index}
            className="absolute left-1/2 top-1/2 group"
            style={{
              width: itemSize,
              height: itemSize,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
              opacity,
              zIndex: Math.round(normalizedZ * 40),
              transition: "opacity 0.1s linear",
            }}
          >
            {typeof item.content === "string" ? (
              <img
                src={item.content}
                alt={item.label || `Planet ${index + 1}`}
                className="w-full h-full rounded-full object-cover"
                style={{
                  filter: `drop-shadow(0 0 ${6 + normalizedZ * 10}px rgba(0, 180, 255, ${0.15 + normalizedZ * 0.2}))`,
                }}
                loading="lazy"
              />
            ) : (
              item.content
            )}
            {item.label && (
              <span
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-body whitespace-nowrap
                           text-electric-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           pointer-events-none"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
