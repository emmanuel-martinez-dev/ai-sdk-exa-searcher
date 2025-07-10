"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface StreamingResult {
  id: string
  title: string
  author?: string
  publishedDate?: string
  summary?: string
  text?: string
  url: string
  isComplete: boolean
}

interface StreamingResultCardProps {
  result: StreamingResult
  isStreaming: boolean
}

export const StreamingResultCard = React.memo(({ 
  result, 
  isStreaming: isResultStreaming 
}: StreamingResultCardProps) => (
  <div className={cn(
    "p-4 border border-gray-100 rounded-lg mb-3 transition-all duration-300",
    result.isComplete ? "bg-white shadow-sm" : "bg-gray-50",
    !result.title && "opacity-50"
  )}>
    <div className="space-y-2">
      {/* Título */}
      <div className="flex items-start gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors",
          result.isComplete ? "bg-green-500" : "bg-blue-500"
        )}></div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 leading-tight">
            {result.title || 'Cargando...'}
            {isResultStreaming && !result.isComplete && (
              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
            )}
          </h3>
        </div>
      </div>

      {/* Metadatos */}
      {(result.author || result.publishedDate) && result.title && (
        <div className="ml-4 space-y-1 text-sm text-gray-600">
          {result.author && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Autor:</span>
              <span>{result.author}</span>
            </div>
          )}
          
          {result.publishedDate && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Fecha:</span>
              <span>{new Date(result.publishedDate).toLocaleDateString('es-AR')}</span>
            </div>
          )}
        </div>
      )}

      {/* Resumen/Contenido */}
      {(result.summary || result.text) && result.title && (
        <div className="ml-4 text-sm text-gray-700 leading-relaxed">
          <span className="font-medium text-gray-800">Resumen:</span>
          <p className="mt-1">
            {result.summary || (result.text ? result.text.substring(0, 200) + '...' : '')}
          </p>
        </div>
      )}

      {/* URL */}
      {result.url && result.title && (
        <div className="ml-4">
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline break-all transition-colors"
          >
            {result.url}
          </a>
        </div>
      )}
    </div>
  </div>
), (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  return (
    prevProps.result.id === nextProps.result.id &&
    prevProps.result.title === nextProps.result.title &&
    prevProps.result.isComplete === nextProps.result.isComplete &&
    prevProps.isStreaming === nextProps.isStreaming
  )
})

StreamingResultCard.displayName = 'StreamingResultCard'

// Exportar también el tipo para usar en otros componentes
export type { StreamingResult } 