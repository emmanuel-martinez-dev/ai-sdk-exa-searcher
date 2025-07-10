"use client"

import React from "react"

export const ResultSkeleton = React.memo(() => (
  <div className="animate-pulse space-y-2 p-4 border border-gray-100 rounded-lg">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-1">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
))

ResultSkeleton.displayName = 'ResultSkeleton' 