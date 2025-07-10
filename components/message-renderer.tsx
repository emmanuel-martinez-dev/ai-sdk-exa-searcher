"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { RefreshCcw, Copy, Share2, ThumbsUp, ThumbsDown } from "lucide-react"
import { StreamingResultCard, type StreamingResult } from "./streaming-result-card"
import { ResultSkeleton } from "./result-skeleton"
import type { StreamingState } from "./streaming-engine"

interface Message {
  id: string
  content: string
  type: "user" | "system"
  completed?: boolean
  newSection?: boolean
  searchResults?: any[]
  error?: string
}

interface MessageRendererProps {
  message: Message
  streamingMessageId: string | null
  streamingState: StreamingState
  currentStreamingResults: StreamingResult[]
  shouldShowSkeleton: boolean
  completedMessages: Set<string>
}

export const MessageRenderer = React.memo(({
  message,
  streamingMessageId,
  streamingState,
  currentStreamingResults,
  shouldShowSkeleton,
  completedMessages
}: MessageRendererProps) => {
  const isCompleted = completedMessages.has(message.id)
  const isStreamingMessage = message.id === streamingMessageId

  return (
    <div className={cn("flex flex-col", message.type === "user" ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[90%] px-4 py-3 rounded-2xl",
          message.type === "user" 
            ? "bg-white border border-gray-200 rounded-br-none" 
            : "bg-transparent",
        )}
      >
        {/* Contenido del mensaje de usuario */}
        {message.type === "user" && message.content && (
          <div className="text-gray-900">
            {message.content}
          </div>
        )}

        {/* Contenido del sistema con streaming mejorado */}
        {message.type === "system" && (
          <div className="space-y-3 w-full">
            {/* Header con contador de resultados */}
            {(isStreamingMessage || message.searchResults) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  {isStreamingMessage 
                    ? `Buscando resultados...` 
                    : `Encontré ${message.searchResults?.length || 0} resultado${(message.searchResults?.length || 0) > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            )}

            {/* Resultados con streaming progresivo */}
            {isStreamingMessage && currentStreamingResults.length > 0 && (
              <div className="space-y-3">
                {currentStreamingResults.map((result, index) => (
                  <StreamingResultCard 
                    key={result.id} 
                    result={result} 
                    isStreaming={index === streamingState.currentResultIndex && !result.isComplete}
                  />
                ))}
                
                {/* Skeleton para el próximo resultado */}
                {shouldShowSkeleton && (
                  <ResultSkeleton />
                )}
              </div>
            )}

            {/* Resultados completados */}
            {message.searchResults && !isStreamingMessage && (
              <div className="space-y-3">
                {message.searchResults.map((result, index) => (
                  <StreamingResultCard 
                    key={`completed-${message.id}-${index}`} 
                    result={{
                      id: `completed-${message.id}-${index}`,
                      title: result.title,
                      author: result.author,
                      publishedDate: result.publishedDate,
                      summary: result.summary,
                      text: result.text,
                      url: result.url,
                      isComplete: true
                    }} 
                    isStreaming={false}
                  />
                ))}
              </div>
            )}

            {/* Mensaje de error o contenido simple */}
            {message.content && !message.searchResults && !isStreamingMessage && (
              <div className="text-gray-700 leading-relaxed">
                {message.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones de mensaje */}
      {message.type === "system" && message.completed && (
        <div className="flex items-center gap-2 px-4 mt-2 mb-2">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Copy className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Optimización de re-renders
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.completed === nextProps.message.completed &&
    prevProps.streamingMessageId === nextProps.streamingMessageId &&
    prevProps.streamingState.currentResultIndex === nextProps.streamingState.currentResultIndex &&
    prevProps.streamingState.isComplete === nextProps.streamingState.isComplete &&
    prevProps.currentStreamingResults.length === nextProps.currentStreamingResults.length &&
    prevProps.shouldShowSkeleton === nextProps.shouldShowSkeleton
  )
})

MessageRenderer.displayName = 'MessageRenderer'

// Exportar también el tipo Message
export type { Message } 