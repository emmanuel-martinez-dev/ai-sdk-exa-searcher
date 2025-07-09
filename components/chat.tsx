"use client"

import { cn } from "@/lib/utils"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Search, MessageSquare, Globe, FileText, ArrowUp } from "lucide-react"

type ActiveButton = "none" | "search" | "ask" | "crawling" | "research"

interface ChatProps {
  isChatCentered: boolean
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  inputContainerRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  inputValue: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isStreaming: boolean
  activeButton: ActiveButton
  toggleButton: (button: ActiveButton) => void
  handleInputContainerClick: (e?: React.MouseEvent<HTMLDivElement>) => void
  hasTyped: boolean
}

export const Chat = ({
  isChatCentered,
  handleSubmit,
  inputContainerRef,
  textareaRef,
  inputValue,
  handleInputChange,
  handleKeyDown,
  isStreaming,
  activeButton,
  toggleButton,
  handleInputContainerClick,
  hasTyped,
}: ChatProps) => {

    return (
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
                  // Textarea visible cuando se enfoca
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
    )
}
