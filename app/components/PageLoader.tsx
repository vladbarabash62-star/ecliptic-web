"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = window.setTimeout(() => setVisible(false), 650);

    return () => window.clearTimeout(hide);
  }, []);

  if (!visible) return null;

  return (
    <div className="site-loader fixed inset-0 z-[999] flex items-center justify-center bg-[#04060c]">
      <Image
        src="/loading-icon.png"
        alt="Ecliptic"
        width={170}
        height={170}
        priority
        className="site-loader__icon h-[150px] w-[150px] object-contain sm:h-[180px] sm:w-[180px]"
      />
    </div>
  );
}
