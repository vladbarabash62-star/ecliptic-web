"use client";

const stars = Array.from({ length: 95 }, (_, index) => {
  const left = (index * 37 + 11) % 100;
  const top = (index * 53 + 7) % 100;
  const size = index % 9 === 0 ? 2.2 : index % 4 === 0 ? 1.6 : 1;
  const duration = 2.4 + (index % 11) * 0.38;
  const delay = -((index * 0.47) % 5.8);

  return { left, top, size, duration, delay };
});

export default function SpaceScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,8,14,0.12)_62%,rgba(5,7,13,0.38)_100%)]" />
    </div>
  );
}
