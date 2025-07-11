"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { generateTitles } from "@/actions/vercel-actions/generate-titles"
import { useChat } from 'ai/react'
import { toast } from "sonner"
import {
  FileText,
  Sparkles,
  Edit3,
  Save,
  X,
  Copy,
  Download,
  User,
  Calendar,
  Link as LinkIcon,
  Wand2,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown
} from "lucide-react"

interface ArticleData {
  title: string
  author?: string
  summary?: string
  url: string
  publishedDate?: string
  text?: string
  timestamp?: number
}

interface GenerateArticleOptions {
  tone?: 'formal' | 'casual' | 'technical' | 'investigative'
  length?: 'short' | 'medium' | 'long'
  focus?: 'news' | 'analysis' | 'opinion' | 'feature'
}

export default function Page() {
  const [articleData, setArticleData] = useState<ArticleData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  
  // Estados para la generacion de titulos
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [generatedTitles, setGeneratedTitles] = useState<Array<{title: string, reason: string}>>([])
  const [showTitlesPanel, setShowTitlesPanel] = useState(false)
  const [titleCount, setTitleCount] = useState(5)
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
  
  // Opciones de tono
  const [options, setOptions] = useState<GenerateArticleOptions>({
    tone: 'formal',
    length: 'medium',
    focus: 'news'
  })

  // Hook useChat para manejar el streaming
  const { messages, append, isLoading } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      setGeneratedContent(message.content)
      setIsGenerating(false)
    },
    onError: (error) => {
      setError(error.message)
      setIsGenerating(false)
    }
  })

  // Cargar datos del artículo desde localStorage al inicializar (solo una vez)
  useEffect(() => {
    const storedArticleData = localStorage.getItem('articleData')
    if (storedArticleData) {
      try {
        const parsedData = JSON.parse(storedArticleData)
        setArticleData(parsedData)
        localStorage.removeItem('articleData') // Limpiar después de usar
      } catch (error) {
        console.error('Error parsing article data:', error)
      }
    }
  }, [])

  // Efecto para manejar el streaming del contenido
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        setGeneratedContent(lastMessage.content)
      }
    }
  }, [messages])

  // Efecto para manejar el estado de carga
  useEffect(() => {
    setIsGenerating(isLoading)
  }, [isLoading])

  useEffect(() => {
    if (generatedContent && !isEditing) {
      setEditedContent(generatedContent)
    }
  }, [generatedContent, isEditing])

  const handleGenerateDocument = async () => {
    if (!articleData) return
    
    setIsGenerating(true)
    setError(null)
    setGeneratedContent("")
    setEditedContent("")
    setIsEditing(false)
    setHasUnsavedChanges(false)
    
    try {
      await append({
        role: 'user',
        content: 'generate_article'
      }, {
        body: {
          articleData,
          options
        }
      })
    } catch (error) {
      console.error('Error generating article:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al generar el artículo')
      setIsGenerating(false)
    }
  }

  const handleDismiss = () => {
    setArticleData(null)
    setGeneratedContent("")
    setEditedContent("")
    setError(null)
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setGeneratedTitles([])
    setShowTitlesPanel(false)
    setSelectedTitle(null)
  }

  const handleGenerateTitles = async () => {
    if (!generatedContent) return
    
    setIsGeneratingTitles(true)
    setGeneratedTitles([])
    
    try {
      const result = await generateTitles(generatedContent, {
        count: titleCount,
        tone: options.tone,
        focus: options.focus
      })
      
      setGeneratedTitles(result.titles)
      setShowTitlesPanel(true)
    } catch (error) {
      console.error('Error generating titles:', error)
      setError(error instanceof Error ? error.message : 'Error al generar títulos')
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  const handleSelectTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setSelectedTitle(title)
      toast.success("Título copiado al portapapeles", {
        description: `"${title.length > 50 ? title.substring(0, 50) + '...' : title}"`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error("Error al copiar el título", {
        description: "No se pudo copiar el título al portapapeles",
        duration: 3000,
      })
    }
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditedContent(generatedContent)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent(generatedContent)
    setHasUnsavedChanges(false)
  }

  const handleSaveEdit = () => {
    setGeneratedContent(editedContent)
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  const handleContentChange = (value: string) => {
    setEditedContent(value)
    setHasUnsavedChanges(value !== generatedContent)
  }

  const handleCopy = async () => {
    const contentToCopy = isEditing ? editedContent : generatedContent
    if (contentToCopy) {
      await navigator.clipboard.writeText(contentToCopy)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleDownload = () => {
    const contentToDownload = isEditing ? editedContent : generatedContent
    if (contentToDownload) {
      const blob = new Blob([contentToDownload], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `articulo-${articleData?.title?.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'generado'}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    }
  }

  const getLengthDescription = (length: string) => {
    switch (length) {
      case 'short': return '300-500 palabras'
      case 'medium': return '600-800 palabras'
      case 'long': return '900-1200 palabras'
      default: return '600-800 palabras'
    }
  }

  const getFocusDescription = (focus: string) => {
    switch (focus) {
      case 'news': return 'Información directa y objetiva'
      case 'analysis': return 'Análisis profundo y contextual'
      case 'opinion': return 'Perspectiva editorial y opinión'
      case 'feature': return 'Narrativa detallada y envolvente'
      default: return 'Información directa y objetiva'
    }
  }

  const getWordCount = (text: string) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Generamos el articulo */}
              {articleData && (
                <div className="px-4 lg:px-6 space-y-6">
                  <Card className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Generador de Artículos IA
                          {isEditing && (
                            <Badge variant="secondary" className="ml-2">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Editando
                            </Badge>
                          )}
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleDismiss}
                          className="h-8 w-8 p-0"
                          disabled={isGenerating}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 leading-tight text-lg">
                          {articleData.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {articleData.author && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{articleData.author}</span>
                            </div>
                          )}
                          {articleData.publishedDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(articleData.publishedDate).toLocaleDateString('es-AR')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <a 
                              href={articleData.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Ver fuente
                            </a>
                          </div>
                        </div>

                        {articleData.summary && (
                          <div className="bg-gray-50 p-3 rounded-lg border">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {articleData.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuración del artículo */}
                  {!generatedContent && !isGenerating && (
                    <Card className="border-2">
                      <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <Sparkles className="h-5 w-5" />
                          Configuración del artículo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-4">
                            <Label htmlFor="tone" className="text-base font-medium">
                              Tono del artículo
                            </Label>
                            <Select value={options.tone} onValueChange={(value) => setOptions(prev => ({ ...prev, tone: value as GenerateArticleOptions['tone'] }))}>
                              <SelectTrigger id="tone" className="h-12">
                                <SelectValue placeholder="Selecciona el tono" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="technical">Técnico</SelectItem>
                                <SelectItem value="investigative">Investigativo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="length" className="text-base font-medium">
                              Longitud del artículo
                            </Label>
                            <Select value={options.length} onValueChange={(value) => setOptions(prev => ({ ...prev, length: value as GenerateArticleOptions['length'] }))}>
                              <SelectTrigger id="length" className="h-12">
                                <SelectValue placeholder="Selecciona la longitud" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short">Corto</SelectItem>
                                <SelectItem value="medium">Medio</SelectItem>
                                <SelectItem value="long">Largo</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-2">
                              {getLengthDescription(options.length || 'medium')}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="focus" className="text-base font-medium">
                              Enfoque editorial
                            </Label>
                            <Select value={options.focus} onValueChange={(value) => setOptions(prev => ({ ...prev, focus: value as GenerateArticleOptions['focus'] }))}>
                              <SelectTrigger id="focus" className="h-12">
                                <SelectValue placeholder="Selecciona el enfoque" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="news">Noticia</SelectItem>
                                <SelectItem value="analysis">Análisis</SelectItem>
                                <SelectItem value="opinion">Opinión</SelectItem>
                                <SelectItem value="feature">Reportaje</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-2">
                              {getFocusDescription(options.focus || 'news')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={handleGenerateDocument}
                            disabled={isGenerating}
                            className="px-6"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generar Artículo con IA
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleDismiss}
                            disabled={isGenerating}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generando contenido */}
                  {isGenerating && (
                    <Card className="border-2 border-blue-200 bg-blue-50/50">
                      <CardContent className="py-8">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-blue-900">Generando artículo...</h3>
                            <p className="text-blue-700 text-sm">
                              Creando contenido periodístico basado en la información proporcionada
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Error */}
                  {error && (
                    <Card className="border-2 border-red-200 bg-red-50/50">
                      <CardContent className="py-8">
                        <div className="text-center space-y-4 max-w-md mx-auto">
                          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-red-900">Error al generar el artículo</h3>
                            <p className="text-red-700 text-sm">{error}</p>
                          </div>
                          <Button 
                            onClick={handleGenerateDocument}
                            disabled={isGenerating}
                            className="px-4 py-2 h-auto"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reintentar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contenido generado */}
                  {generatedContent && (
                    <Card className="border-2">
                      <CardHeader className="pb-6">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <FileText className="h-5 w-5 text-green-600" />
                            Artículo Generado
                            {isEditing && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit3 className="h-3 w-3 mr-1" />
                                Editando
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isGeneratingTitles}
                                  className="px-4 py-2 h-auto"
                                >
                                  {isGeneratingTitles ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <>
                                      <Wand2 className="h-4 w-4 mr-2" />
                                      Títulos IA ({titleCount})
                                    </>
                                  )}
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Generar títulos alternativos</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Selecciona cuántos títulos quieres generar
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="titleCount" className="text-sm font-medium">
                                      Cantidad de títulos
                                    </Label>
                                    <Select onValueChange={(value) => setTitleCount(Number(value))} value={titleCount.toString()}>
                                      <SelectTrigger id="titleCount" className="h-8">
                                        <SelectValue placeholder="Selecciona una cantidad" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1 título</SelectItem>
                                        <SelectItem value="2">2 títulos</SelectItem>
                                        <SelectItem value="3">3 títulos</SelectItem>
                                        <SelectItem value="4">4 títulos</SelectItem>
                                        <SelectItem value="5">5 títulos</SelectItem>
                                        <SelectItem value="6">6 títulos</SelectItem>
                                        <SelectItem value="7">7 títulos</SelectItem>
                                        <SelectItem value="8">8 títulos</SelectItem>
                                        <SelectItem value="9">9 títulos</SelectItem>
                                        <SelectItem value="10">10 títulos</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={handleGenerateTitles}
                                    disabled={isGeneratingTitles}
                                    className="w-full"
                                  >
                                    {isGeneratingTitles ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Generando...
                                      </>
                                    ) : (
                                      <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generar {titleCount} título{titleCount !== 1 ? 's' : ''}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            {!isEditing ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="px-4 py-2 h-auto"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={!hasUnsavedChanges}
                                  className="px-4 py-2 h-auto"
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Guardar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2 h-auto"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Panel de títulos generados */}
                        {showTitlesPanel && generatedTitles.length > 0 && (
                          <Card className="border-2 border-purple-200 bg-purple-50/50">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                  <Wand2 className="h-5 w-5 text-purple-600" />
                                  Títulos alternativos generados
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowTitlesPanel(false)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {generatedTitles.map((titleData, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                                    selectedTitle === titleData.title
                                      ? 'border-purple-400 bg-purple-100'
                                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                  }`}
                                  onClick={() => handleSelectTitle(titleData.title)}
                                  title="Haz clic para copiar al portapapeles"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-medium text-gray-900 flex-1">{titleData.title}</h4>
                                      <div className="flex items-center gap-1 text-gray-400">
                                        <Copy className="h-3 w-3" />
                                        {selectedTitle === titleData.title && (
                                          <Check className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600">{titleData.reason}</p>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {/* Editor de contenido */}
                        <div className="space-y-4">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    Palabras: {getWordCount(editedContent)}
                                  </span>
                                  {hasUnsavedChanges && (
                                    <Badge variant="secondary" className="text-xs">
                                      Cambios sin guardar
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Textarea
                                value={editedContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="min-h-[400px] resize-none"
                                placeholder="Escribe tu artículo aquí..."
                              />
                            </div>
                          ) : (
                            <div className="prose prose-gray max-w-none">
                              <div className="bg-gray-50 p-6 rounded-lg border">
                                <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                                  {generatedContent}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={handleCopy}
                            className={`px-4 py-2 h-auto ${copySuccess ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                          >
                            {copySuccess ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copySuccess ? 'Copiado' : 'Copiar'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDownload}
                            className={`px-4 py-2 h-auto ${downloadSuccess ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                          >
                            {downloadSuccess ? <Check className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            {downloadSuccess ? 'Descargado' : 'Descargar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Sin datos de artículo */}
              {!articleData && (
                <div className="px-4 lg:px-6">
                  <Card className="border-2 border-gray-200">
                    <CardContent className="py-12">
                      <div className="text-center space-y-4 max-w-md mx-auto">
                        <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900">No hay artículo seleccionado</h3>
                          <p className="text-gray-600 text-sm">
                            Ve a la página de búsqueda y selecciona un artículo para generar contenido con IA.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
