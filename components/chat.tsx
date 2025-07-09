"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Search,
  Globe,
  MessageSquare,
  FileText,
  ArrowUp,
  Menu,
  RefreshCcw,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { askExa } from "@/actions/exa-actions/search-web"

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

// Delay más rápido para streaming más fluido
const WORD_DELAY = 40 // ms por palabra
const CHUNK_SIZE = 2 // Número de palabras para agregar de una vez

export default function Chat() {
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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const shouldFocusAfterStreamingRef = useRef(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  // Almacena el estado de selección del textarea
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })
  const [isChatCentered, setIsChatCentered] = useState(true)

  // Constantes para cálculos de layout considerando los valores de padding
  const HEADER_HEIGHT = 48 // 12px height + padding
  const INPUT_AREA_HEIGHT = 100 // Altura aproximada del área de input con padding
  const TOP_PADDING = 48 // pt-12 (3rem = 48px)
  const BOTTOM_PADDING = 128 // pb-32 (8rem = 128px)
  const ADDITIONAL_OFFSET = 16 // Offset reducido para ajuste fino

  // Detecta si es móvil y obtiene la altura del viewport
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)

      // Captura la altura del viewport
      const vh = window.innerHeight
      setViewportHeight(vh)

      // Aplica altura fija al contenedor principal en móvil
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`
      }
    }

    checkMobileAndViewport()

    // Establece altura inicial
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile ? `${viewportHeight}px` : "100svh"
    }

    // Actualiza en resize
    window.addEventListener("resize", checkMobileAndViewport)

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport)
    }
  }, [isMobile, viewportHeight])

  // Organiza mensajes en secciones
  useEffect(() => {
    if (messages.length === 0) {
      setMessageSections([])
      setActiveSectionId(null)
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
        // Inicia una nueva sección
        if (currentSection.messages.length > 0) {
          // Marca la sección anterior como inactiva
          sections.push({
            ...currentSection,
            isActive: false,
          })
        }

        // Crea nueva sección activa
        const newSectionId = `section-${Date.now()}-${sections.length}`
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        }

        // Actualiza ID de sección activa
        setActiveSectionId(newSectionId)
      } else {
        // Agrega a la sección actual
        currentSection.messages.push(message)
      }
    })

    // Agrega la última sección si tiene mensajes
    if (currentSection.messages.length > 0) {
      sections.push(currentSection)
    }

    setMessageSections(sections)
  }, [messages])

  // Scroll a posición máxima cuando se crea nueva sección, solo para secciones después de la primera
  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current

        if (scrollContainer) {
          // Scroll a posición máxima posible
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messageSections])

  // Enfoca el textarea al montar el componente (solo en desktop)
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }, [isMobile])

  // Devuelve el foco al textarea después de que termina el streaming (solo en desktop)
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea()
      shouldFocusAfterStreamingRef.current = false
    }
  }, [isStreaming, isMobile])

  // Calcula la altura de contenido disponible (viewport menos header e input)
  const getContentHeight = () => {
    // Calcula altura disponible restando el padding superior e inferior del viewport height
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

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const simulateTextStreaming = async (text: string) => {
    // Divide el texto en palabras
    const words = text.split(" ")
    let currentIndex = 0
    setStreamingWords([])
    setIsStreaming(true)

    return new Promise<void>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          // Agrega algunas palabras a la vez
          const nextIndex = Math.min(currentIndex + CHUNK_SIZE, words.length)
          const newWordsArray = words.slice(currentIndex, nextIndex)

          setStreamingWords((prev) => {
            const newWords = [
              ...prev,
              {
                id: Date.now() + currentIndex,
                text: newWordsArray.join(" ") + " ",
              },
            ]

            // Auto-scroll durante el streaming
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
              }
            }, 10)

            return newWords
          })

          currentIndex = nextIndex
        } else {
          clearInterval(streamInterval)
          resolve()
        }
      }, WORD_DELAY)
    })
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
      
      // Formatea los resultados usando la nueva estructura results
      const formattedResponse = formatExaResults(exaResponse.results)
      
      // Hace streaming del texto formateado
      await simulateTextStreaming(formattedResponse)

      // Actualiza con el mensaje completo incluyendo los resultados originales
      setMessages((prev) =>
        prev.map((msg) => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: formattedResponse, 
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
      
      // Hace streaming del mensaje de error
      await simulateTextStreaming(errorMessage)
      
      // Actualiza con el mensaje de error
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
      // Guarda el estado de selección actual antes de cambiar
      saveSelectionState()

      setActiveButton((prev) => (prev === button ? "none" : button))

      // Restaura el estado de selección después de cambiar
      setTimeout(() => {
        restoreSelectionState()
      }, 0)
    }
  }

  const renderMessage = (message: Message) => {
    const isCompleted = completedMessages.has(message.id)

    return (
      <div key={message.id} className={cn("flex flex-col", message.type === "user" ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[80%] px-4 py-2 rounded-2xl",
            message.type === "user" ? "bg-white border border-gray-200 rounded-br-none" : "text-gray-900",
          )}
        >
          {/* Para mensajes de usuario o mensajes del sistema completados, renderiza sin animación */}
          {message.content && (
            <div className={message.type === "system" && !isCompleted ? "animate-fade-in" : ""}>
              {/* Renderiza el contenido formateado */}
              {message.content.split('\n').map((line, index) => {
                if (line.trim() === '') return <br key={index} />
                
                // Maneja texto en negrita
                if (line.includes('**')) {
                  const parts = line.split('**')
                  return (
                    <div key={index} className="mb-1">
                      {parts.map((part, partIndex) => 
                        partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
                      )}
                    </div>
                  )
                }
                
                return <div key={index} className="mb-1">{line}</div>
              })}
            </div>
          )}

          {/* Para mensajes en streaming, renderiza con animación */}
          {message.id === streamingMessageId && (
            <span className="inline">
              {streamingWords.map((word) => (
                <span key={word.id} className="animate-fade-in inline">
                  {word.text}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Acciones de mensaje */}
        {message.type === "system" && message.completed && (
          <div className="flex items-center gap-2 px-4 mt-1 mb-2">
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

  // Determina si una sección debe tener altura fija (solo para secciones después de la primera)
  const shouldApplyHeight = (sectionIndex: number) => {
    return sectionIndex > 0
  }

  return (
    <div
      ref={mainContainerRef}
      className="bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh" }}
    >
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

      {/* Título centrado de AI Searcher - solo se muestra cuando el chat está centrado */}
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

      <div
        className={cn(
          "fixed left-0 right-0 p-4 bg-gray-50 transition-all duration-700 ease-in-out",
          isChatCentered ? "bottom-1/2 translate-y-16" : "bottom-0 translate-y-0",
        )}
      >
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div
            ref={inputContainerRef}
            className={cn(
              "relative w-full rounded-3xl border border-gray-200 bg-white p-3 cursor-text shadow-lg",
              isStreaming && "opacity-80",
            )}
            onClick={handleInputContainerClick}
          >
            <div className="pb-9">
              <Textarea
                ref={textareaRef}
                placeholder={isStreaming ? "Buscando en Exa..." : "Preguntá lo que quieras"}
                className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Asegura que el textarea esté visible cuando se enfoca
                  if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }}
              />
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        activeButton === "search" && "bg-gray-100 border-gray-300",
                      )}
                      onClick={() => toggleButton("search")}
                      disabled={isStreaming}
                    >
                      <Search className={cn("h-4 w-4 text-gray-500", activeButton === "search" && "text-gray-700")} />
                      <span className="sr-only">Search</span>
                    </Button>
                    <div
                      className={cn(
                        "absolute left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50",
                        isChatCentered ? "top-full mt-3" : "bottom-full mb-3",
                      )}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Search className="h-4 w-4 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Búsqueda</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Devuelve resultados y su contenido desde toda la web con capacidades de búsqueda inteligente.
                        </p>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full border-b-4 border-b-white"
                              : "top-full border-t-4 border-t-white",
                          )}
                        ></div>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full translate-y-px border-b-4 border-b-gray-200"
                              : "top-full translate-y-px border-t-4 border-t-gray-200",
                          )}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        activeButton === "ask" && "bg-gray-100 border-gray-300",
                      )}
                      onClick={() => toggleButton("ask")}
                      disabled={isStreaming}
                    >
                      <MessageSquare
                        className={cn("h-4 w-4 text-gray-500", activeButton === "ask" && "text-gray-700")}
                      />
                      <span className="sr-only">Ask</span>
                    </Button>
                    <div
                      className={cn(
                        "absolute left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50",
                        isChatCentered ? "top-full mt-3" : "bottom-full mb-3",
                      )}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Preguntar</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Respuestas rápidas con información en tiempo real y tiempos de respuesta optimizados.
                        </p>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full border-b-4 border-b-white"
                              : "top-full border-t-4 border-t-white",
                          )}
                        ></div>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full translate-y-px border-b-4 border-b-gray-200"
                              : "top-full translate-y-px border-t-4 border-t-gray-200",
                          )}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        activeButton === "crawling" && "bg-gray-100 border-gray-300",
                      )}
                      onClick={() => toggleButton("crawling")}
                      disabled={isStreaming}
                    >
                      <Globe className={cn("h-4 w-4 text-gray-500", activeButton === "crawling" && "text-gray-700")} />
                      <span className="sr-only">Crawling</span>
                    </Button>
                    <div
                      className={cn(
                        "absolute left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50",
                        isChatCentered ? "top-full mt-3" : "bottom-full mb-3",
                      )}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Globe className="h-4 w-4 text-purple-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Crawling</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Devuelve contenido de páginas web específicas extrayendo datos de URLs particulares.
                        </p>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full border-b-4 border-b-white"
                              : "top-full border-t-4 border-t-white",
                          )}
                        ></div>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full translate-y-px border-b-4 border-b-gray-200"
                              : "top-full translate-y-px border-t-4 border-t-gray-200",
                          )}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 flex-shrink-0 border-gray-200 p-0 transition-colors",
                        activeButton === "research" && "bg-gray-100 border-gray-300",
                      )}
                      onClick={() => toggleButton("research")}
                      disabled={isStreaming}
                    >
                      <FileText
                        className={cn("h-4 w-4 text-gray-500", activeButton === "research" && "text-gray-700")}
                      />
                      <span className="sr-only">Research</span>
                    </Button>
                    <div
                      className={cn(
                        "absolute left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50",
                        isChatCentered ? "top-full mt-3" : "bottom-full mb-3",
                      )}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Investigación</h3>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              BETA
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Capacidades de investigación profunda para reportes completos y resultados estructurados.
                        </p>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full border-b-4 border-b-white"
                              : "top-full border-t-4 border-t-white",
                          )}
                        ></div>
                        <div
                          className={cn(
                            "absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isChatCentered
                              ? "bottom-full translate-y-px border-b-4 border-b-gray-200"
                              : "top-full translate-y-px border-t-4 border-t-gray-200",
                          )}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-8 w-8 border-0 flex-shrink-0 transition-all duration-200",
                    hasTyped ? "bg-black scale-110" : "bg-gray-200",
                  )}
                  disabled={!inputValue.trim() || isStreaming}
                >
                  <ArrowUp className={cn("h-4 w-4 transition-colors", hasTyped ? "text-white" : "text-gray-500")} />
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
