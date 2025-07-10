"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, User, Calendar, Link as LinkIcon, Check, X, Copy, Download, Sparkles } from "lucide-react"
import { generateArticle } from "@/actions/vercel-actions/generate-article"

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

export default function Page() {
  const [articleData, setArticleData] = useState<ArticleData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [generationComplete, setGenerationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  
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

  const handleGenerateDocument = async () => {
    if (!articleData) return
    
    setIsGenerating(true)
    setError(null)
    setGeneratedContent("")
    setGenerationComplete(false)
    
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
    setError(null)
  }

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' })
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
                      <Card className="border-2 border-green-200 bg-green-50/50">
                        <CardContent className="pt-6 pb-6">
                          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
                                <Check className="h-4 w-4 mr-2" />
                                Artículo generado exitosamente
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
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
                                  setGenerationComplete(false)
                                  setError(null)
                                }}
                                className="px-4 py-2 h-auto"
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Nuevo
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contenido del artículo */}
                      <Card className="border-2">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <FileText className="h-5 w-5" />
                            Artículo generado
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
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
