"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  RefreshCcw,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { askExa } from "@/actions/exa-actions/search-web"
import { Header } from "./header"
import { Title } from "./title"
import { Chat } from "./chat"

// Agregar estilos CSS personalizados
const customStyles = `
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

// Inyectar estilos en el head si no existen
if (typeof document !== 'undefined' && !document.getElementById('chat-custom-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'chat-custom-styles'
  styleSheet.textContent = customStyles
  document.head.appendChild(styleSheet)
}

type ActiveButton = "none" | "search" | "ask" | "crawling" | "research"
type MessageType = "user" | "system"

interface Message {
  id: string
  content: string
  type: MessageType
  completed?: boolean
  newSection?: boolean
  searchResults?: any[] // Para almacenar resultados de Exa
  error?: string
}

interface MessageSection {
  id: string
  messages: Message[]
  isNewSection: boolean
  isActive?: boolean
  sectionIndex: number
}

interface StreamingWord {
  id: number
  text: string
}

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

interface StreamingState {
  currentResultIndex: number
  currentField: 'title' | 'author' | 'date' | 'summary' | 'url' | 'complete'
  results: StreamingResult[]
  isComplete: boolean
}

// Delay más rápido para streaming más fluido
const WORD_DELAY = 40 // ms por palabra
const CHUNK_SIZE = 2 // Número de palabras para agregar de una vez

// Componente memoizado para evitar re-renders
const MemoizedResultCard = React.memo(({ 
  result, 
  isStreaming: isResultStreaming 
}: { 
  result: StreamingResult
  isStreaming: boolean 
}) => (
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

MemoizedResultCard.displayName = 'MemoizedResultCard'

// Skeleton memoizado
const MemoizedSkeleton = React.memo(() => (
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

MemoizedSkeleton.displayName = 'MemoizedSkeleton'

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const newSectionRef = useRef<HTMLDivElement>(null)
  const [hasTyped, setHasTyped] = useState(false)
  const [activeButton, setActiveButton] = useState<ActiveButton>("none")
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageSections, setMessageSections] = useState<MessageSection[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const shouldFocusAfterStreamingRef = useRef(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  // Almacena el estado de selección del textarea
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })
  const [isChatCentered, setIsChatCentered] = useState(true)
  const [streamingState, setStreamingState] = useState<StreamingState>({
    currentResultIndex: 0,
    currentField: 'title',
    results: [],
    isComplete: false
  })

  // Constantes para el layout, considerando los valores de padding
  // Esto es para mejorar el layout en mobile
  const TOP_PADDING = 48 // pt-12 (3rem = 48px)
  const BOTTOM_PADDING = 128 // pb-32 (8rem = 128px)
  const ADDITIONAL_OFFSET = 16 // Offset reducido para ajuste fino

  // Cambio la altura del viewport en mobile
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)

      // Capturo altura del viewport
      const vh = window.innerHeight
      setViewportHeight(vh)

      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`
      }
    }

    checkMobileAndViewport()

    // Seteo altura inicial
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile ? `${viewportHeight}px` : "100svh"
    }

    // Se actualiza el resize segun corresponda
    window.addEventListener("resize", checkMobileAndViewport)

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport)
    }
  }, [isMobile, viewportHeight])

  // Organiz0 los mensajes en secciones, como podrian hacerlo Exa o Perplexity.
  // Esto es para mejorar la experiencia de usuario
  useEffect(() => {
    if (messages.length === 0) {
      setMessageSections([])
      return
    }

    const sections: MessageSection[] = []
    let currentSection: MessageSection = {
      id: `section-${Date.now()}-0`,
      messages: [],
      isNewSection: false,
      sectionIndex: 0,
    }

    messages.forEach((message) => {
      if (message.newSection) {
        // Seteo nueva seccion
        if (currentSection.messages.length > 0) {
          // Marco la seccion anterior como inactiva
          sections.push({
            ...currentSection,
            isActive: false,
          })
        }

        // Creo nueva seccion activa
        const newSectionId = `section-${Date.now()}-${sections.length}`
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        }

      } else {
        // Agrego nuevo mensaje a la seccion actual
        currentSection.messages.push(message)
      }
    })

    // Agrego la ultima seccion si tiene mensajes
    if (currentSection.messages.length > 0) {
      sections.push(currentSection)
    }
    console.log(JSON.stringify(sections, null, 2))
    setMessageSections(sections)
  }, [messages])

  // Setea la vista al final del chat cuando se crea nueva seccion/mensaje
  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current

        if (scrollContainer) {
          // Scroll a la posicion maxima posible
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messageSections])

  // Seteo el cursor del usuario al textarea
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }, [isMobile])

  // Cuando el streaming de la respuesta termina, seteo el cursor del usuario al textarea
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea()
      shouldFocusAfterStreamingRef.current = false
    }
  }, [isStreaming, isMobile])

  // Calculo la altura de contenido disponible (viewport menos header e input)
  // con las constantes de arriba
  const getContentHeight = () => {
    return viewportHeight - TOP_PADDING - BOTTOM_PADDING - ADDITIONAL_OFFSET
  }

  // Guarda el estado de selección actual
  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      }
    }
  }

  // Restaura el estado de selección guardado
  const restoreSelectionState = () => {
    const textarea = textareaRef.current
    const { start, end } = selectionStateRef.current

    if (textarea && start !== null && end !== null) {
      // Enfoca primero, luego establece el rango de selección
      textarea.focus()
      textarea.setSelectionRange(start, end)
    } else if (textarea) {
      // Si no hay selección guardada, solo enfoca
      textarea.focus()
    }
  }

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }

  const handleInputContainerClick = (e?: React.MouseEvent<HTMLDivElement>) => {
    // Si no hay evento, simplemente enfoca el textarea
    if (!e) {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
      return
    }
    
    // Solo enfoca si hace clic directamente en el contenedor, no en botones u otros elementos interactivos
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current && !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const simulateProgressiveStreaming = async (exaResults: any[]) => {
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
      navigator.vibrate(30)
      
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

  // Función para formatear los resultados de Exa en texto legible
  const formatExaResults = (results: any[]) => {
    if (!results || results.length === 0) {
      return "No se encontraron resultados para tu búsqueda."
    }

    let formattedText = `Encontré ${results.length} resultado${results.length > 1 ? 's' : ''} relevante${results.length > 1 ? 's' : ''}:\n\n`

    results.forEach((result, index) => {
      formattedText += `${index + 1}. **${result.title}**\n`
      
      if (result.author) {
        formattedText += `   Autor: ${result.author}\n`
      }
      
      if (result.publishedDate) {
        const date = new Date(result.publishedDate).toLocaleDateString('es-AR')
        formattedText += `   Fecha: ${date}\n`
      }
      
      if (result.summary) {
        formattedText += `   Resumen: ${result.summary}\n`
      } else if (result.text) {
        // Si no hay resumen, usa los primeros 200 caracteres del texto
        const preview = result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '')
        formattedText += `   Contenido: ${preview}\n`
      }
      
      formattedText += `   URL: ${result.url}\n`
      
      formattedText += '\n'
    })

    return formattedText
  }

  const handleExaSearch = async (userMessage: string) => {
    // Crea un nuevo mensaje con contenido vacío
    const messageId = Date.now().toString()
    setStreamingMessageId(messageId)

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        content: "",
        type: "system",
      },
    ])

    // Agrega vibración cuando comienza el streaming
    setTimeout(() => {
      navigator.vibrate(50)
    }, 200)

    try {
      // Llama a la API de Exa
      const exaResponse = await askExa(userMessage)
      
      // Usa el nuevo sistema de streaming progresivo
      await simulateProgressiveStreaming(exaResponse.results)

      // Actualiza con el mensaje completo incluyendo los resultados originales
      setMessages((prev) =>
        prev.map((msg) => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: "", // Ya no necesitamos contenido de texto
                completed: true,
                searchResults: exaResponse.results 
              } 
            : msg
        ),
      )

      // Agrega vibración cuando termina el streaming
      navigator.vibrate(50)

    } catch (error) {
      console.error('Error al buscar en Exa:', error)
      
      const errorMessage = "Lo siento, hubo un error al realizar la búsqueda. Por favor, intentá de nuevo."
      
      // Para errores, usa el sistema simple
      setMessages((prev) =>
        prev.map((msg) => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: errorMessage, 
                completed: true,
                error: error instanceof Error ? error.message : 'Error desconocido'
              } 
            : msg
        ),
      )
    }

    // Agrega a mensajes completados para prevenir re-animación
    setCompletedMessages((prev) => new Set(prev).add(messageId))

    // Resetea estado de streaming
    setStreamingWords([])
    setStreamingMessageId(null)
    setIsStreaming(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Solo permite cambios de input cuando no está haciendo streaming
    if (!isStreaming) {
      setInputValue(newValue)

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true)
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false)
      }

      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(24, Math.min(textarea.scrollHeight, 160))
        textarea.style.height = `${newHeight}px`
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isStreaming) {
      // Agrega vibración cuando se envía el mensaje
      navigator.vibrate(50)

      const userMessage = inputValue.trim()

      // Agrega como nueva sección si ya existen mensajes
      const shouldAddNewSection = messages.length > 0

      const newUserMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        type: "user" as MessageType,
        newSection: shouldAddNewSection,
      }

      // Resetea input antes de comenzar la respuesta de la IA
      setInputValue("")
      setHasTyped(false)
      setActiveButton("none")

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Agrega el mensaje después de resetear el input
      setMessages((prev) => [...prev, newUserMessage])

      // Scroll al final inmediatamente después de agregar mensaje de usuario
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)

      // Mueve el chat hacia abajo en el primer mensaje
      if (isChatCentered) {
        setIsChatCentered(false)
      }

      // Solo enfoca el textarea en desktop, no en móvil
      if (!isMobile) {
        focusTextarea()
      } else {
        // En móvil, desenfoca el textarea para ocultar el teclado
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      }

      // Inicia búsqueda en Exa
      handleExaSearch(userMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Maneja Cmd+Enter tanto en móvil como en desktop
    if (!isStreaming && e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Solo maneja Enter normal (sin Shift) en desktop
    if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    if (messagesEndRef.current && !isChatCentered) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingWords, isChatCentered])

  const toggleButton = (button: ActiveButton) => {
    if (!isStreaming) {
      // Guardo el estado de seleccion actual antes de cambiar
      saveSelectionState()

      setActiveButton((prev) => (prev === button ? "none" : button))

      // Restauro el estado de seleccion despues de cambiar
      setTimeout(() => {
        restoreSelectionState()
      }, 0)
    }
  }

  // Usar useMemo para evitar re-cálculos innecesarios
  const currentStreamingResults = useMemo(() => {
    return streamingState.results.filter(result => result.title || !result.isComplete)
  }, [streamingState.results])

  const shouldShowSkeleton = useMemo(() => {
    return !streamingState.isComplete && 
           streamingState.currentResultIndex < streamingState.results.length - 1
  }, [streamingState.isComplete, streamingState.currentResultIndex, streamingState.results.length])

  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id)
    const isStreamingMessage = message.id === streamingMessageId

    return (
      <div key={message.id} className={cn("flex flex-col", message.type === "user" ? "items-end" : "items-start")}>
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
                    <MemoizedResultCard 
                      key={result.id} 
                      result={result} 
                      isStreaming={index === streamingState.currentResultIndex && !result.isComplete}
                    />
                  ))}
                  
                  {/* Skeleton para el próximo resultado */}
                  {shouldShowSkeleton && (
                    <MemoizedSkeleton />
                  )}
                </div>
              )}

              {/* Resultados completados */}
              {message.searchResults && !isStreamingMessage && (
                <div className="space-y-3">
                  {message.searchResults.map((result, index) => (
                    <MemoizedResultCard 
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
  }

  const shouldApplyHeight = (sectionIndex: number) => {
    return sectionIndex > 0
  }

  return (
    <div
      ref={mainContainerRef}
      className="bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh" }}
    >
      <Header />
      <div
        className={cn(
          "flex-grow px-4 overflow-y-auto transition-all duration-700 ease-in-out",
          isChatCentered ? "pb-32 pt-12 opacity-0" : "pb-32 pt-12 opacity-100",
        )}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messageSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              ref={sectionIndex === messageSections.length - 1 && section.isNewSection ? newSectionRef : null}
            >
              {section.isNewSection && (
                <div
                  style={
                    section.isActive && shouldApplyHeight(section.sectionIndex)
                      ? { height: `${getContentHeight()}px` }
                      : {}
                  }
                  className="pt-4 flex flex-col justify-start"
                >
                  {section.messages.map((message) => renderMessage(message))}
                </div>
              )}

              {!section.isNewSection && <div>{section.messages.map((message) => renderMessage(message))}</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <Title isChatCentered={isChatCentered} />
      <Chat 
        isChatCentered={isChatCentered}
        handleSubmit={handleSubmit}
        inputContainerRef={inputContainerRef}
        textareaRef={textareaRef}
        inputValue={inputValue}
        handleInputChange={handleInputChange}
        handleKeyDown={handleKeyDown}
        isStreaming={isStreaming}
        activeButton={activeButton}
        toggleButton={toggleButton}
        handleInputContainerClick={() => handleInputContainerClick()}
        hasTyped={hasTyped}
      />
    </div>
  )
}
