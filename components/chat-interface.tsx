"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { askExa } from "@/actions/exa-actions/search-web"
import { Header } from "./header"
import { Title } from "./title"
import { Chat } from "./chat"
import { MessageRenderer, type Message } from "./message-renderer"
import { useStreamingEngine } from "./streaming-engine"
import { ChatAnimations } from "./chat-animations"

type ActiveButton = "none" | "search" | "ask" | "crawling" | "research"
type MessageType = "user" | "system"

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
  const [streamingWords, setStreamingWords] = useState<StreamingWord[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const shouldFocusAfterStreamingRef = useRef(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  // Almacena el estado de selección del textarea
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })
  const [isChatCentered, setIsChatCentered] = useState(true)

  // Usar el hook de streaming
  const {
    streamingState,
    isStreaming,
    currentStreamingResults,
    shouldShowSkeleton,
    simulateProgressiveStreaming,
  } = useStreamingEngine()

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

  // Organizo los mensajes en secciones, como podrian hacerlo Exa o Perplexity
  // Esto es para mejorar la experiencia de usuario a la hora de chequear los resultados
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }

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
    // setCompletedMessages((prev) => new Set(prev).add(messageId))

    // Resetea estado de streaming
    setStreamingWords([])
    setStreamingMessageId(null)
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }

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

  const shouldApplyHeight = (sectionIndex: number) => {
    return sectionIndex > 0
  }

  return (
    <>
      <ChatAnimations />
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
                    {section.messages.map((message) => (
                      <MessageRenderer
                        key={message.id}
                        message={message}
                        streamingMessageId={streamingMessageId}
                        streamingState={streamingState}
                        currentStreamingResults={currentStreamingResults}
                        shouldShowSkeleton={shouldShowSkeleton}
                      />
                    ))}
                  </div>
                )}

                {!section.isNewSection && (
                  <div>
                    {section.messages.map((message) => (
                      <MessageRenderer
                        key={message.id}
                        message={message}
                        streamingMessageId={streamingMessageId}
                        streamingState={streamingState}
                        currentStreamingResults={currentStreamingResults}
                        shouldShowSkeleton={shouldShowSkeleton}
                      />
                    ))}
                  </div>
                )}
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
    </>
  )
}
