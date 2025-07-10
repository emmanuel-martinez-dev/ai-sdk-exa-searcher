'use server'

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

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

export async function generateArticle(
    articleData: ArticleData,
    options: GenerateArticleOptions = {}
) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno')
    }

    const {
        tone = 'formal',
        length = 'medium',
        focus = 'news'
    } = options

    // Construir prompt estructurado para periodismo
    const systemPrompt = `
        Sos un periodista profesional especializado en crear artículos de alta calidad. 
        Tu tarea es generar un artículo periodístico bien estructurado basado en la información proporcionada.

        INSTRUCCIONES:
        - Tono: ${tone === 'formal' ? 'formal y profesional' : tone === 'casual' ? 'accesible y conversacional' : tone === 'technical' ? 'técnico y detallado' : 'investigativo y analítico'}
        - Longitud: ${length === 'short' ? '300-500 palabras' : length === 'medium' ? '600-800 palabras' : '900-1200 palabras'}
        - Enfoque: ${focus === 'news' ? 'noticia informativa' : focus === 'analysis' ? 'análisis profundo' : focus === 'opinion' ? 'artículo de opinión' : 'reportaje extenso'}

        ESTRUCTURA REQUERIDA:
        1. **TITULAR**: Atractivo y preciso (máximo 80 caracteres)
        2. **LEAD**: Párrafo inicial que responda qué, quién, cuándo, dónde, por qué (2-3 líneas)
        3. **DESARROLLO**: 3-4 párrafos que desarrollen la información
        4. **CONTEXTO**: Información de fondo relevante
        5. **CONCLUSIÓN**: Cierre que resuma los puntos clave o proyecte implicaciones

        REGLAS:
        - Usa un lenguaje claro y preciso
        - Incluye datos específicos cuando estén disponibles
        - Mantén la objetividad periodística
        - Estructura párrafos de 3-4 líneas máximo
        - Usa conectores apropiados entre párrafos`

    const userPrompt = `
    Genera un artículo periodístico basado en la siguiente información:
        **Título original**: ${articleData.title}
        **Autor/Fuente**: ${articleData.author || 'No especificado'}
        **Resumen**: ${articleData.summary || 'No disponible'}
        **URL de referencia**: ${articleData.url}
        **Fecha de publicación**: ${articleData.publishedDate ? new Date(articleData.publishedDate).toLocaleDateString('es-AR') : 'No especificada'}

        Desarrolla un artículo completo y bien estructurado que expanda esta información de manera profesional.`

    try {
        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
        })

        return {
            textStream: result.textStream,
            metadata: {
                originalData: articleData,
                options,
                generatedAt: new Date().toISOString(),
            }
        }
    } catch (error) {
        console.error('Error generating article:', error)
        throw new Error('Error al generar el artículo. Por favor, intentá de nuevo.')
    }
} 
