import { useState, useCallback } from 'react'
import { generateArticle } from '@/actions/vercel-actions/generate-article'

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

interface UseArticleGeneratorReturn {
    isGenerating: boolean
    generatedContent: string
    error: string | null
    progress: number
    generateArticleFromData: (
        articleData: ArticleData,
        options?: GenerateArticleOptions
    ) => Promise<void>
    resetGenerator: () => void
}

export function useArticleGenerator(): UseArticleGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const generateArticleFromData = useCallback(async (
        articleData: ArticleData,
        options: GenerateArticleOptions = {}
    ) => {
        if (isGenerating) return

        try {
            setIsGenerating(true)
            setError(null)
            setGeneratedContent('')
            setProgress(0)

            // Llamar al server action
            const result = await generateArticle(articleData, options)

            // Leer el stream de texto
            let accumulatedText = ''
            let wordCount = 0
            const targetWordCount = options.length === 'short' ? 400 :
                options.length === 'medium' ? 700 : 1000

            for await (const delta of result.textStream) {
                if (delta) {
                    accumulatedText += delta

                    // Contar palabras aproximadamente
                    wordCount = accumulatedText.split(/\s+/).length

                    // Calcular progreso basado en palabras
                    const currentProgress = Math.min((wordCount / targetWordCount) * 100, 100)
                    setProgress(currentProgress)

                    setGeneratedContent(accumulatedText)
                }
            }

            // Asegurar que el progreso esté al 100% al final
            setProgress(100)

        } catch (err) {
            console.error('Error generando artículo:', err)
            setError(err instanceof Error ? err.message : 'Error desconocido al generar artículo')
        } finally {
            setIsGenerating(false)
        }
    }, [isGenerating])

    const resetGenerator = useCallback(() => {
        setIsGenerating(false)
        setGeneratedContent('')
        setError(null)
        setProgress(0)
    }, [])

    return {
        isGenerating,
        generatedContent,
        error,
        progress,
        generateArticleFromData,
        resetGenerator
    }
} 