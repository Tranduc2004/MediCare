import React from "react";

export const BadgeDot: React.FC<{ count?: number }> = ({ count = 0 }) => (
  <span
    className={`ml-2 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full
                    text-[11px] px-1.5 ${
                      count > 0
                        ? "bg-red-500 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
  >
    {count > 99 ? "99+" : count}
  </span>
);
