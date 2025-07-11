"use client"

import { useState, useMemo } from "react"
import type { StreamingResult } from "./streaming-result-card"

interface ExaSearchResult {
  id: string
  title: string
  url: string
  publishedDate: string
  author: string
  text?: string
  summary?: string
  image?: string
  favicon?: string
}

interface StreamingState {
  currentResultIndex: number
  currentField: 'title' | 'author' | 'date' | 'summary' | 'url' | 'complete'
  results: StreamingResult[]
  isComplete: boolean
}

export const useStreamingEngine = () => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    currentResultIndex: 0,
    currentField: 'title',
    results: [],
    isComplete: false
  })

  const [isStreaming, setIsStreaming] = useState(false)

  // Usar useMemo para evitar re-cálculos innecesarios
  const currentStreamingResults = useMemo(() => {
    return streamingState.results.filter(result => result.title || !result.isComplete)
  }, [streamingState.results])

  const shouldShowSkeleton = useMemo(() => {
    return !streamingState.isComplete && 
           streamingState.currentResultIndex < streamingState.results.length - 1
  }, [streamingState.isComplete, streamingState.currentResultIndex, streamingState.results.length])

  const simulateProgressiveStreaming = async (exaResults: ExaSearchResult[]) => {
    setIsStreaming(true)
    
    // Crear resultados iniciales con IDs únicos y estables
    const initialResults: StreamingResult[] = exaResults.map((result, index) => ({
      id: `result-${Date.now()}-${index}`, // ID único y estable
      title: '',
      author: result.author,
      publishedDate: result.publishedDate,
      summary: result.summary,
      text: result.text,
      url: result.url,
      isComplete: false
    }))

    // Setear todos los resultados de una vez para evitar múltiples re-renders
    setStreamingState({
      currentResultIndex: 0,
      currentField: 'title',
      results: initialResults,
      isComplete: false
    })

    // Simular streaming con menos actualizaciones de estado
    for (let i = 0; i < exaResults.length; i++) {
      const result = exaResults[i]
      
      // Agregar vibración para cada nuevo resultado
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30)
      }
      
      // Delay antes de mostrar el resultado
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Actualizar solo el resultado específico
      setStreamingState(prev => {
        const newResults = [...prev.results]
        newResults[i] = {
          ...newResults[i],
          title: result.title || '',
          isComplete: true
        }
        
        return {
          ...prev,
          results: newResults,
          currentResultIndex: i
        }
      })
      
      // Pausa entre resultados
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    
    setStreamingState(prev => ({ ...prev, isComplete: true }))
    setIsStreaming(false)
  }

  const resetStreaming = () => {
    setStreamingState({
      currentResultIndex: 0,
      currentField: 'title',
      results: [],
      isComplete: false
    })
    setIsStreaming(false)
  }

  return {
    streamingState,
    isStreaming,
    currentStreamingResults,
    shouldShowSkeleton,
    simulateProgressiveStreaming,
    resetStreaming
  }
}

// Exportar también el tipo para usar en otros componentes
export type { StreamingState } 