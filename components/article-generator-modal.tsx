"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Copy, Download, FileText, Loader2, Sparkles, Clock, User, Calendar, Check, AlertCircle } from 'lucide-react'
import { useArticleGenerator } from '@/hooks/use-article-generator'

interface ArticleData {
  title: string
  author?: string
  summary?: string
  url: string
  publishedDate?: string
}

interface GenerateArticleOptions {
  tone?: 'formal' | 'casual' | 'technical' | 'investigative'
  length?: 'short' | 'medium' | 'long'
  focus?: 'news' | 'analysis' | 'opinion' | 'feature'
}

interface ArticleGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  articleData: ArticleData
}

export function ArticleGeneratorModal({ isOpen, onClose, articleData }: ArticleGeneratorModalProps) {
  const [options, setOptions] = useState<GenerateArticleOptions>({
    tone: 'formal',
    length: 'medium',
    focus: 'news'
  })
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const {
    isGenerating,
    generatedContent,
    error,
    progress,
    generateArticleFromData,
    resetGenerator
  } = useArticleGenerator()

  const handleGenerate = async () => {
    await generateArticleFromData(articleData, options)
  }

  const handleClose = () => {
    resetGenerator()
    onClose()
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
      const blob = new Blob([generatedContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `articulo-${articleData.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.txt`
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-8 py-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <FileText className="h-6 w-6" />
            Generador de Artículos IA
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Crea artículos periodísticos profesionales con inteligencia artificial
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-8 overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-8">
          {/* Información del artículo fuente */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="h-5 w-5" />
                Fuente del artículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <h4 className="font-medium leading-relaxed text-lg">
                  {articleData.title}
                </h4>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                {articleData.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{articleData.author}</span>
                  </div>
                )}
                {articleData.publishedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(articleData.publishedDate).toLocaleDateString('es-AR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opciones de configuración */}
          {!generatedContent && !isGenerating && (
            <Card className="border-2">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Sparkles className="h-5 w-5" />
                  Configuración del artículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-0">
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
              </CardContent>
            </Card>
          )}

          {/* Estado inicial - Botón de generar */}
          {!generatedContent && !isGenerating && !error && (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-6">
                  <Button size="lg" onClick={handleGenerate} className="px-12 py-4 text-lg h-auto">
                    <Sparkles className="h-5 w-5 mr-3" />
                    Generar Artículo con IA
                  </Button>
                  <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                    Nuestro sistema de IA creará un artículo periodístico profesional basado en tu configuración y la fuente seleccionada.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de generación */}
          {isGenerating && (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-8 max-w-md">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xl">Generando tu artículo...</h3>
                    <p className="text-base text-muted-foreground">
                      Nuestro sistema de IA está trabajando en tu contenido
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="flex justify-between text-base">
                      <span>Progreso</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de error */}
          {error && (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-6 max-w-md">
                  <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xl text-destructive">Error al generar artículo</h3>
                    <p className="text-base text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" onClick={handleGenerate} className="px-8 py-3 h-auto">
                    Intentar de nuevo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Artículo generado */}
          {generatedContent && (
            <div className="space-y-6">
              {/* Barra de estado y acciones */}
              <Card className="border-2">
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
                        onClick={() => resetGenerator()}
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
                  <div className="max-h-[500px] overflow-y-auto border rounded-lg p-6 bg-muted/20">
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
      </DialogContent>
    </Dialog>
  )
} 