"use client"

import { Menu } from "lucide-react"
import { Button } from "./ui/button"

export const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-20 bg-gray-50">
        <div className="w-full flex items-center justify-between px-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Menu className="h-5 w-5 text-gray-700" />
            <span className="sr-only">Menu</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 px-3 py-1 h-8">
              Sign In
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-300 px-3 py-1 h-8 bg-transparent"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>
    )
}
