"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Share2, Download, Copy, FileText } from "lucide-react"

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
    "p-4 border border-gray-100 rounded-lg mb-3 transition-all duration-300 group",
    result.isComplete ? "bg-white shadow-sm" : "bg-gray-50",
    !result.title && "opacity-50"
  )}>
    <div className="space-y-2">
      {/* Header con título y acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
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

        {/* Acciones del bloque - solo aparecen cuando está completado */}
        {result.isComplete && result.title && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Compartir"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Exportar"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copiar"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Generar artículo"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
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