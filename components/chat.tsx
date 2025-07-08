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

type ActiveButton = "none" | "search" | "ask" | "crawling" | "research"
type MessageType = "user" | "system"

interface Message {
  id: string
  content: string
  type: MessageType
  completed?: boolean
  newSection?: boolean
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

// Faster word delay for smoother streaming
const WORD_DELAY = 40 // ms per word
const CHUNK_SIZE = 2 // Number of words to add at once

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
  // Store selection state
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null })
  const [isChatCentered, setIsChatCentered] = useState(true)

  // Constants for layout calculations to account for the padding values
  const HEADER_HEIGHT = 48 // 12px height + padding
  const INPUT_AREA_HEIGHT = 100 // Approximate height of input area with padding
  const TOP_PADDING = 48 // pt-12 (3rem = 48px)
  const BOTTOM_PADDING = 128 // pb-32 (8rem = 128px)
  const ADDITIONAL_OFFSET = 16 // Reduced offset for fine-tuning

  // Check if device is mobile and get viewport height
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)

      // Capture the viewport height
      const vh = window.innerHeight
      setViewportHeight(vh)

      // Apply fixed height to main container on mobile
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`
      }
    }

    checkMobileAndViewport()

    // Set initial height
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile ? `${viewportHeight}px` : "100svh"
    }

    // Update on resize
    window.addEventListener("resize", checkMobileAndViewport)

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport)
    }
  }, [isMobile, viewportHeight])

  // Organize messages into sections
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
        // Start a new section
        if (currentSection.messages.length > 0) {
          // Mark previous section as inactive
          sections.push({
            ...currentSection,
            isActive: false,
          })
        }

        // Create new active section
        const newSectionId = `section-${Date.now()}-${sections.length}`
        currentSection = {
          id: newSectionId,
          messages: [message],
          isNewSection: true,
          isActive: true,
          sectionIndex: sections.length,
        }

        // Update active section ID
        setActiveSectionId(newSectionId)
      } else {
        // Add to current section
        currentSection.messages.push(message)
      }
    })

    // Add the last section if it has messages
    if (currentSection.messages.length > 0) {
      sections.push(currentSection)
    }

    setMessageSections(sections)
  }, [messages])

  // Scroll to maximum position when new section is created, but only for sections after the first
  useEffect(() => {
    if (messageSections.length > 1) {
      setTimeout(() => {
        const scrollContainer = chatContainerRef.current

        if (scrollContainer) {
          // Scroll to maximum possible position
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [messageSections])

  // Focus the textarea on component mount (only on desktop)
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }, [isMobile])

  // Set focus back to textarea after streaming ends (only on desktop)
  useEffect(() => {
    if (!isStreaming && shouldFocusAfterStreamingRef.current && !isMobile) {
      focusTextarea()
      shouldFocusAfterStreamingRef.current = false
    }
  }, [isStreaming, isMobile])

  // Calculate available content height (viewport minus header and input)
  const getContentHeight = () => {
    // Calculate available height by subtracting the top and bottom padding from viewport height
    return viewportHeight - TOP_PADDING - BOTTOM_PADDING - ADDITIONAL_OFFSET
  }

  // Save the current selection state
  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      }
    }
  }

  // Restore the saved selection state
  const restoreSelectionState = () => {
    const textarea = textareaRef.current
    const { start, end } = selectionStateRef.current

    if (textarea && start !== null && end !== null) {
      // Focus first, then set selection range
      textarea.focus()
      textarea.setSelectionRange(start, end)
    } else if (textarea) {
      // If no selection was saved, just focus
      textarea.focus()
    }
  }

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus()
    }
  }

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
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
    // Split text into words
    const words = text.split(" ")
    let currentIndex = 0
    setStreamingWords([])
    setIsStreaming(true)

    return new Promise<void>((resolve) => {
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          // Add a few words at a time
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

            // Auto-scroll during streaming
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

  const getAIResponse = (userMessage: string) => {
    const responses = [
      `That's an interesting perspective. Let me elaborate on that a bit further. When we consider the implications of what you've shared, several key points come to mind. First, it's important to understand the context and how it relates to broader concepts. This allows us to develop a more comprehensive understanding of the situation. Would you like me to explore any specific aspect of this in more detail?`,

      `I appreciate you sharing that. From what I understand, there are multiple layers to consider here. The initial aspect relates to the fundamental principles we're discussing, but there's also a broader context to consider. This reminds me of similar scenarios where the underlying patterns reveal interesting connections. What aspects of this would you like to explore further?`,

      `Thank you for bringing this up. It's a fascinating topic that deserves careful consideration. When we analyze the details you've provided, we can identify several important elements that contribute to our understanding. This kind of discussion often leads to valuable insights and new perspectives. Is there a particular element you'd like me to focus on?`,

      `Your message raises some compelling points. Let's break this down systematically to better understand the various components involved. There are several key factors to consider, each contributing to the overall picture in unique ways. This kind of analysis often reveals interesting patterns and connections that might not be immediately apparent. What specific aspects would you like to delve into?`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const simulateAIResponse = async (userMessage: string) => {
    const response = getAIResponse(userMessage)

    // Create a new message with empty content
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

    // Add a delay before the second vibration
    setTimeout(() => {
      // Add vibration when streaming begins
      navigator.vibrate(50)
    }, 200) // 200ms delay to make it distinct from the first vibration

    // Stream the text
    await simulateTextStreaming(response)

    // Update with complete message
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content: response, completed: true } : msg)),
    )

    // Add to completed messages set to prevent re-animation
    setCompletedMessages((prev) => new Set(prev).add(messageId))

    // Add vibration when streaming ends
    navigator.vibrate(50)

    // Reset streaming state
    setStreamingWords([])
    setStreamingMessageId(null)
    setIsStreaming(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Only allow input changes when not streaming
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
      // Add vibration when message is submitted
      navigator.vibrate(50)

      const userMessage = inputValue.trim()

      // Add as a new section if messages already exist
      const shouldAddNewSection = messages.length > 0

      const newUserMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        type: "user" as MessageType,
        newSection: shouldAddNewSection,
      }

      // Reset input before starting the AI response
      setInputValue("")
      setHasTyped(false)
      setActiveButton("none")

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Add the message after resetting input
      setMessages((prev) => [...prev, newUserMessage])

      // Scroll to bottom immediately after adding user message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)

      // Move chat down on first message
      if (isChatCentered) {
        setIsChatCentered(false)
      }

      // Only focus the textarea on desktop, not on mobile
      if (!isMobile) {
        focusTextarea()
      } else {
        // On mobile, blur the textarea to dismiss the keyboard
        if (textareaRef.current) {
          textareaRef.current.blur()
        }
      }

      // Start AI response
      simulateAIResponse(userMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd+Enter on both mobile and desktop
    if (!isStreaming && e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Only handle regular Enter key (without Shift) on desktop
    if (!isStreaming && !isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isChatCentered) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingWords, isChatCentered])

  const toggleButton = (button: ActiveButton) => {
    if (!isStreaming) {
      // Save the current selection state before toggling
      saveSelectionState()

      setActiveButton((prev) => (prev === button ? "none" : button))

      // Restore the selection state after toggling
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
          {/* For user messages or completed system messages, render without animation */}
          {message.content && (
            <span className={message.type === "system" && !isCompleted ? "animate-fade-in" : ""}>
              {message.content}
            </span>
          )}

          {/* For streaming messages, render with animation */}
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

        {/* Message actions */}
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

  // Determine if a section should have fixed height (only for sections after the first)
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

      {/* Centered AI Searcher Title - only show when chat is centered */}
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
                placeholder={isStreaming ? "Waiting for response..." : "Ask Anything"}
                className="min-h-[24px] max-h-[160px] w-full rounded-3xl border-0 bg-transparent text-gray-900 placeholder:text-gray-400 placeholder:text-base focus-visible:ring-0 focus-visible:ring-offset-0 text-base pl-2 pr-4 pt-0 pb-0 resize-none overflow-y-auto leading-tight"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Ensure the textarea is scrolled into view when focused
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
                          <h3 className="font-semibold text-gray-900">Search</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Return results and their contents from across the web with comprehensive search capabilities.
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
                          <h3 className="font-semibold text-gray-900">Ask</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Fast, web-grounded answers with real-time information and quick response times.
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
                          Returns webpage contents by crawling and extracting data from specific URLs and websites.
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
                            <h3 className="font-semibold text-gray-900">Research</h3>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              BETA
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Long-running research capabilities for comprehensive reports and structured outputs.
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
