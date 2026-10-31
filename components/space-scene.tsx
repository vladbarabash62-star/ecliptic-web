"use client";

import { useEffect, useRef, useState } from "react";

const stars = Array.from({ length: 95 }, (_, index) => {
  const left = (index * 37 + 11) % 100;
  const top = (index * 53 + 7) % 100;
  const size = index % 9 === 0 ? 2.2 : index % 4 === 0 ? 1.6 : 1;
  const duration = 2.4 + (index % 11) * 0.38;
  const delay = -((index * 0.47) % 5.8);

  return { left, top, size, duration, delay };
});

const halloweenImages = [
  "/halloween/candy-orange.png",
  "/halloween/pumpkin.png",
  "/halloween/ghost.png",
  "/halloween/candy-purple.png",
];

const halloweenFlyers = Array.from({ length: 20 }, (_, index) => ({
  src: halloweenImages[index % halloweenImages.length],
  x: (index * 137 + 31) % 86,
  y: (index * 83 + 13) % 82,
  speedX: 0.16 + (index % 5) * 0.035,
  speedY: 0.12 + (index % 4) * 0.028,
  directionX: index % 2 === 0 ? 1 : -1,
  directionY: index % 3 === 0 ? -1 : 1,
  rotation: (index * 19) % 360,
  rotationSpeed: index % 2 === 0 ? 0.05 : -0.04,
}));

const HALLOWEEN_END = new Date(2026, 10, 3, 0, 0, 0, 0).getTime();

export default function SpaceScene() {
  const [halloweenVisible, setHalloweenVisible] = useState(false);
  const flyerRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const start = window.setTimeout(
      () => setHalloweenVisible(Date.now() < HALLOWEEN_END),
      0,
    );
    const timeout = window.setTimeout(
      () => setHalloweenVisible(false),
      Math.max(0, HALLOWEEN_END - Date.now() + 100),
    );

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!halloweenVisible) return;

    const positions = halloweenFlyers.map((flyer) => ({ ...flyer }));
    let frame = 0;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const elapsed = Math.min(32, time - lastTime);
      lastTime = time;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const size = Math.min(58, Math.max(38, Math.round(Math.min(width, height) * 0.07)));

      positions.forEach((position, index) => {
        const maxX = Math.max(0, width - size);
        const maxY = Math.max(0, height - size);
        position.x += position.speedX * position.directionX * elapsed;
        position.y += position.speedY * position.directionY * elapsed;
        position.rotation += position.rotationSpeed * elapsed;

        if (position.x <= 0 || position.x >= maxX) {
          position.x = Math.max(0, Math.min(maxX, position.x));
          position.directionX *= -1;
        }
        if (position.y <= 0 || position.y >= maxY) {
          position.y = Math.max(0, Math.min(maxY, position.y));
          position.directionY *= -1;
        }

        const element = flyerRefs.current[index];
        if (element) {
          element.style.width = `${size}px`;
          element.style.height = `${size}px`;
          element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(${position.rotation}deg)`;
        }
      });

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [halloweenVisible]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      {stars.map((star, index) => (
        <span
          key={`star-${index}`}
          className="twinkle-dot absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      {halloweenVisible && (
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
          {halloweenFlyers.map((flyer, index) => (
            <img
              key={`halloween-flyer-${index}`}
              ref={(element) => {
                flyerRefs.current[index] = element;
              }}
              src={flyer.src}
              alt=""
              draggable={false}
              className="absolute left-0 top-0 object-contain opacity-90 drop-shadow-[0_4px_8px_rgba(255,126,0,0.28)]"
              style={{
                width: "48px",
                height: "48px",
                transform: `translate3d(${flyer.x}vw, ${flyer.y}vh, 0) rotate(${flyer.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_62%,rgba(0,0,0,0.42)_100%)]" />
    </div>
  );
}
