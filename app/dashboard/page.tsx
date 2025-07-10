"use client"

import { useEffect, useState, useRef } from "react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { DataTable } from "@/components/dashboard/data-table"
import { SectionCards } from "@/components/dashboard/section-cards"
import { SiteHeader } from "@/components/dashboard/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  FileText, 
  User, 
  Calendar, 
  Link as LinkIcon, 
  Check, 
  X, 
  Copy, 
  Download, 
  Sparkles, 
  Edit3, 
  Save, 
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Image,
  Type,
  Palette,
  Upload,
  Lightbulb,
  RefreshCw
} from "lucide-react"
import { generateArticle } from "@/actions/vercel-actions/generate-article"
import { generateTitles } from "@/actions/vercel-actions/generate-titles"

import data from "./data.json"

interface ArticleData {
  title: string
  author?: string
  summary?: string
  url: string
  publishedDate?: string
  text?: string
}

interface GenerateArticleOptions {
  tone?: 'formal' | 'casual' | 'technical' | 'investigative'
  length?: 'short' | 'medium' | 'long'
  focus?: 'news' | 'analysis' | 'opinion' | 'feature'
}

interface TextFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  align: 'left' | 'center' | 'right'
  fontSize: string
  fontFamily: string
  color: string
}

export default function Page() {
  const [articleData, setArticleData] = useState<ArticleData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  // Estados para la generación de títulos
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [generatedTitles, setGeneratedTitles] = useState<Array<{title: string, reason: string}>>([])
  const [showTitlesPanel, setShowTitlesPanel] = useState(false)
  const [titleCount, setTitleCount] = useState(5)
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
  
  // Estados para el formato de texto
  const [textFormat, setTextFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    fontSize: '16px',
    fontFamily: 'serif',
    color: '#000000'
  })
  
  // Referencias para el editor
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Opciones de generación
  const [options, setOptions] = useState<GenerateArticleOptions>({
    tone: 'formal',
    length: 'medium',
    focus: 'news'
  })

  useEffect(() => {
    // Verificar si hay datos de artículo en localStorage
    const storedArticleData = localStorage.getItem('articleData')
    if (storedArticleData) {
      try {
        const parsedData = JSON.parse(storedArticleData)
        setArticleData(parsedData)
        // Limpiar localStorage después de cargar los datos
        localStorage.removeItem('articleData')
      } catch (error) {
        console.error('Error parsing article data:', error)
      }
    }
  }, [])

  // Sincronizar contenido editado con contenido generado
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
    setGenerationComplete(false)
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setUploadedImages([])
    
    try {
      const result = await generateArticle(articleData, options)
      
      // Procesar el stream de texto
      for await (const chunk of result.textStream) {
        setGeneratedContent(prev => prev + chunk)
      }
      
      setGenerationComplete(true)
    } catch (error) {
      console.error('Error generating article:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al generar el artículo')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDismiss = () => {
    setArticleData(null)
    setGenerationComplete(false)
    setGeneratedContent("")
    setEditedContent("")
    setError(null)
    setIsEditing(false)
    setHasUnsavedChanges(false)
    setUploadedImages([])
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

  const handleSelectTitle = (title: string) => {
    setSelectedTitle(title)
    // Aquí podrías implementar lógica para reemplazar el título en el contenido
    // Por ahora solo lo guardamos como seleccionado
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
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string
            setUploadedImages(prev => [...prev, imageUrl])
            
            // Insertar imagen en el editor
            const imageMarkdown = `\n\n![Imagen](${imageUrl})\n\n`
            const textarea = editorRef.current
            if (textarea) {
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              const newContent = editedContent.slice(0, start) + imageMarkdown + editedContent.slice(end)
              setEditedContent(newContent)
              setHasUnsavedChanges(true)
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const insertFormatting = (formatType: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editedContent.slice(start, end)
    let newText = ""
    let newContent = ""

    switch (formatType) {
      case 'bold':
        newText = selectedText ? `**${selectedText}**` : '**texto en negrita**'
        break
      case 'italic':
        newText = selectedText ? `*${selectedText}*` : '*texto en cursiva*'
        break
      case 'underline':
        newText = selectedText ? `<u>${selectedText}</u>` : '<u>texto subrayado</u>'
        break
      case 'quote':
        newText = selectedText ? `> ${selectedText}` : '> cita'
        break
      case 'list':
        newText = selectedText ? `- ${selectedText}` : '- elemento de lista'
        break
      case 'orderedList':
        newText = selectedText ? `1. ${selectedText}` : '1. elemento numerado'
        break
      case 'heading1':
        newText = selectedText ? `# ${selectedText}` : '# Título Principal'
        break
      case 'heading2':
        newText = selectedText ? `## ${selectedText}` : '## Subtítulo'
        break
      case 'heading3':
        newText = selectedText ? `### ${selectedText}` : '### Título Menor'
        break
      default:
        return
    }

    newContent = editedContent.slice(0, start) + newText + editedContent.slice(end)
    setEditedContent(newContent)
    setHasUnsavedChanges(true)

    // Mantener el foco en el textarea
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  const applyTextAlign = (align: 'left' | 'center' | 'right') => {
    setTextFormat(prev => ({ ...prev, align }))
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

  const getFontFamilyStyle = (fontFamily: string) => {
    switch (fontFamily) {
      case 'serif':
        return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
      case 'sans-serif':
        return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      case 'mono':
        return 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      default:
        return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    }
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
              
              {/* Generador de artículo completo */}
              {articleData && (
                <div className="px-4 lg:px-6 space-y-6">
                  {/* Información del artículo fuente */}
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

                  {/* Configuración - Solo mostrar si no se ha generado contenido */}
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
                            <Select value={options.tone} onValueChange={(value) => setOptions(prev => ({ ...prev, tone: value as any }))}>
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
                            <Select value={options.length} onValueChange={(value) => setOptions(prev => ({ ...prev, length: value as any }))}>
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
                            <Select value={options.focus} onValueChange={(value) => setOptions(prev => ({ ...prev, focus: value as any }))}>
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

                  {/* Estado de generación */}
                  {isGenerating && (
                    <Card className="border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="text-center space-y-8 max-w-md">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                          
                          <div className="space-y-3">
                            <h3 className="font-semibold text-xl">Generando tu artículo...</h3>
                            <p className="text-base text-muted-foreground">
                              Nuestro sistema de IA está trabajando en tu contenido
                            </p>
                          </div>

                          {/* Mostrar contenido mientras se genera */}
                          {generatedContent && (
                            <div className="w-full text-left">
                              <div className="max-h-[300px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                                <div 
                                  className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-sm"
                                  style={{ 
                                    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                                    lineHeight: '1.6'
                                  }}
                                >
                                  {generatedContent}
                                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Error */}
                  {error && (
                    <Card className="border-2 border-red-200 bg-red-50/50">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <div className="text-center space-y-4 max-w-md">
                          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
                            <X className="h-8 w-8 text-red-600" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-red-900">Error al generar artículo</h3>
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                          <Button variant="outline" onClick={handleGenerateDocument} className="px-6">
                            Intentar de nuevo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Artículo generado */}
                  {generatedContent && generationComplete && (
                    <div className="space-y-6">
                      {/* Barra de acciones */}
                      <Card className={`border-2 ${isEditing ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'}`}>
                        <CardContent className="pt-6 pb-6">
                          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className={`px-4 py-2 ${isEditing ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                {isEditing ? (
                                  <>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Modo edición
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Artículo generado exitosamente
                                  </>
                                )}
                              </Badge>
                              {(editedContent || generatedContent) && (
                                <span className="text-sm text-muted-foreground">
                                  {getWordCount(isEditing ? editedContent : generatedContent)} palabras
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Controles de edición */}
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={!hasUnsavedChanges}
                                    className={`px-4 py-2 h-auto ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                  >
                                    {saveSuccess ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {saveSuccess ? 'Guardado' : 'Guardar'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 h-auto"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleStartEdit}
                                  className="px-4 py-2 h-auto"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                              )}
                              
                              {/* Controles de exportación */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className={`px-4 py-2 h-auto ${copySuccess ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                              >
                                {copySuccess ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {copySuccess ? 'Copiado' : 'Copiar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                className={`px-4 py-2 h-auto ${downloadSuccess ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                              >
                                {downloadSuccess ? <Check className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                {downloadSuccess ? 'Descargado' : 'Descargar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setGeneratedContent("")
                                  setEditedContent("")
                                  setGenerationComplete(false)
                                  setError(null)
                                  setIsEditing(false)
                                  setHasUnsavedChanges(false)
                                  setUploadedImages([])
                                  setGeneratedTitles([])
                                  setShowTitlesPanel(false)
                                  setSelectedTitle(null)
                                }}
                                className="px-4 py-2 h-auto"
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Nuevo
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateTitles}
                                disabled={isGeneratingTitles || !generatedContent}
                                className="px-4 py-2 h-auto"
                              >
                                {isGeneratingTitles ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Lightbulb className="h-4 w-4 mr-2" />
                                    Títulos IA
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Advertencia de cambios no guardados */}
                          {hasUnsavedChanges && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Tienes cambios sin guardar. Asegurate de guardar antes de salir.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Barra de herramientas de formato (solo en modo edición) */}
                      {isEditing && (
                        <Card className="border-2 border-blue-200 bg-blue-50/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-3 text-lg">
                              <Type className="h-5 w-5" />
                              Herramientas de formato
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Fila 1: Formato básico */}
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('bold')}
                                  className="h-8 w-8 p-0"
                                  title="Negrita"
                                >
                                  <Bold className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('italic')}
                                  className="h-8 w-8 p-0"
                                  title="Cursiva"
                                >
                                  <Italic className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('underline')}
                                  className="h-8 w-8 p-0"
                                  title="Subrayado"
                                >
                                  <Underline className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('heading1')}
                                  className="h-8 px-2 text-xs font-bold"
                                  title="Título Principal"
                                >
                                  H1
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('heading2')}
                                  className="h-8 px-2 text-xs font-bold"
                                  title="Subtítulo"
                                >
                                  H2
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('heading3')}
                                  className="h-8 px-2 text-xs font-bold"
                                  title="Título Menor"
                                >
                                  H3
                                </Button>
                              </div>

                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('list')}
                                  className="h-8 w-8 p-0"
                                  title="Lista"
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('orderedList')}
                                  className="h-8 w-8 p-0"
                                  title="Lista numerada"
                                >
                                  <ListOrdered className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormatting('quote')}
                                  className="h-8 w-8 p-0"
                                  title="Cita"
                                >
                                  <Quote className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="h-8 w-8 p-0"
                                  title="Agregar imagen"
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>

                            {/* Fila 2: Tipografía y estilo */}
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Fuente:</Label>
                                <Select 
                                  value={textFormat.fontFamily} 
                                  onValueChange={(value) => setTextFormat(prev => ({ ...prev, fontFamily: value }))}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="serif">Serif</SelectItem>
                                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                                    <SelectItem value="mono">Monospace</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Tamaño:</Label>
                                <Select 
                                  value={textFormat.fontSize} 
                                  onValueChange={(value) => setTextFormat(prev => ({ ...prev, fontSize: value }))}
                                >
                                  <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="12px">12px</SelectItem>
                                    <SelectItem value="14px">14px</SelectItem>
                                    <SelectItem value="16px">16px</SelectItem>
                                    <SelectItem value="18px">18px</SelectItem>
                                    <SelectItem value="20px">20px</SelectItem>
                                    <SelectItem value="24px">24px</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Color:</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-16 p-0"
                                    >
                                      <div 
                                        className="w-full h-full rounded"
                                        style={{ backgroundColor: textFormat.color }}
                                      />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Color del texto</Label>
                                      <Input
                                        type="color"
                                        value={textFormat.color}
                                        onChange={(e) => setTextFormat(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-16 h-8 p-0 border-0"
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <Button
                                  variant={textFormat.align === 'left' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => applyTextAlign('left')}
                                  className="h-8 w-8 p-0"
                                  title="Alinear izquierda"
                                >
                                  <AlignLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={textFormat.align === 'center' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => applyTextAlign('center')}
                                  className="h-8 w-8 p-0"
                                  title="Centrar"
                                >
                                  <AlignCenter className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={textFormat.align === 'right' ? 'default' : 'ghost'}
                                  size="sm"
                                  onClick={() => applyTextAlign('right')}
                                  className="h-8 w-8 p-0"
                                  title="Alinear derecha"
                                >
                                  <AlignRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Imágenes subidas */}
                            {uploadedImages.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Imágenes subidas:</Label>
                                <div className="flex flex-wrap gap-2">
                                  {uploadedImages.map((image, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={image}
                                        alt={`Imagen ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Panel de títulos generados */}
                      {showTitlesPanel && generatedTitles.length > 0 && (
                        <Card className="border-2 border-purple-200 bg-purple-50/30">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-3 text-lg">
                                <Lightbulb className="h-5 w-5 text-purple-600" />
                                Títulos alternativos generados
                              </CardTitle>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium">Cantidad:</Label>
                                  <Select 
                                    value={titleCount.toString()} 
                                    onValueChange={(value) => setTitleCount(parseInt(value))}
                                  >
                                    <SelectTrigger className="w-20 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                      <SelectItem value="7">7</SelectItem>
                                      <SelectItem value="10">10</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateTitles}
                                  disabled={isGeneratingTitles}
                                  className="px-3 py-1 h-8"
                                >
                                  {isGeneratingTitles ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowTitlesPanel(false)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              {generatedTitles.map((titleData, index) => (
                                <div
                                  key={index}
                                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                    selectedTitle === titleData.title
                                      ? 'border-purple-500 bg-purple-100'
                                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                                  }`}
                                  onClick={() => handleSelectTitle(titleData.title)}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                      <h4 className="font-semibold text-gray-900 leading-tight">
                                        {titleData.title}
                                      </h4>
                                      {selectedTitle === titleData.title && (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                          <Check className="h-3 w-3 mr-1" />
                                          Seleccionado
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                      {titleData.reason}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>{titleData.title.length} caracteres</span>
                                      <span>•</span>
                                      <span>
                                        {titleData.title.length <= 60 ? '✓ Óptimo para SEO' : 
                                         titleData.title.length <= 80 ? '⚠ Largo para SEO' : 
                                         '❌ Muy largo'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {selectedTitle && (
                              <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Check className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-purple-900">Título seleccionado:</span>
                                </div>
                                <p className="text-purple-800 font-semibold">{selectedTitle}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedTitle)
                                      // Aquí podrías agregar un toast de confirmación
                                    }}
                                    className="px-3 py-1 h-8"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copiar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTitle(null)}
                                    className="px-3 py-1 h-8"
                                  >
                                    Deseleccionar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Contenido del artículo */}
                      <Card className="border-2">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <FileText className="h-5 w-5" />
                            {isEditing ? 'Editando artículo' : 'Artículo generado'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {isEditing ? (
                            <div className="space-y-4">
                              <Label htmlFor="article-editor" className="text-sm font-medium">
                                Editor de artículo
                              </Label>
                              <Textarea
                                ref={editorRef}
                                id="article-editor"
                                value={editedContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="min-h-[600px] resize-none"
                                style={{ 
                                  fontFamily: getFontFamilyStyle(textFormat.fontFamily),
                                  fontSize: textFormat.fontSize,
                                  color: textFormat.color,
                                  textAlign: textFormat.align,
                                  lineHeight: '1.7'
                                }}
                                placeholder="Editá tu artículo aquí..."
                              />
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{getWordCount(editedContent)} palabras</span>
                                <div className="flex items-center gap-4">
                                  <span>Usa **texto** para negrita</span>
                                  <span>Usa *texto* para cursiva</span>
                                  <span>Usa # para títulos</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="max-h-[600px] overflow-y-auto border rounded-lg p-6 bg-gray-50/30">
                              <div 
                                className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed"
                                style={{ 
                                  fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                                  lineHeight: '1.7'
                                }}
                              >
                                {generatedContent}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Componentes originales del dashboard */}
              {!articleData && (
                <>
                  <SectionCards />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                  </div>
                  <DataTable data={data} />
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
