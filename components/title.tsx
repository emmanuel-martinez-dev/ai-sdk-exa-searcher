"use client"

import { cn } from "@/lib/utils"


export const Title = ({ isChatCentered }: { isChatCentered: boolean }) => {
    return (
        <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out z-10 pointer-events-none",
          isChatCentered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
        )}
      >
        <div className="text-center mb-32">
          <h1 className="text-3xl font-bold text-gray-800 mb-20">Gotham</h1>
        </div>
      </div>
    )
}
