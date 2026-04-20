"use client";

import { useState } from "react";

const games = [
  {
    name: "Standoff 2",
    products: ["100 Gold", "500 Gold", "1000 Gold"],
  },
  {
    name: "PUBG Mobile",
    products: ["60 UC", "325 UC", "660 UC"],
  },
  {
    name: "Brawl Stars",
    products: ["30 Gems", "80 Gems", "170 Gems"],
  },
];

export default function HomePage() {
  const [game, setGame] = useState<any>(null);

  // ВСТАВЬ СВОЙ USERNAME БЕЗ @
  const shopUsername = "Ecliptic_Store_PMR";

  const buy = (product: string) => {
    const text = `Здравствуйте, хочу купить ${product} в игре ${game.name}`;
    const url = `https://t.me/${shopUsername}?text=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Магазин</h1>

      {!game ? (
        <div>
          <h2>Выбери игру</h2>

          {games.map((g, i) => (
            <button
              key={i}
              onClick={() => setGame(g)}
              style={{
                display: "block",
                marginBottom: 10,
                padding: 10,
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setGame(null)}
            style={{ marginBottom: 10 }}
          >
            ← Назад
          </button>

          <h2>{game.name}</h2>

          {game.products.map((p: string, i: number) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <span>{p}</span>

              <button
                onClick={() => buy(p)}
                style={{ marginLeft: 10 }}
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}