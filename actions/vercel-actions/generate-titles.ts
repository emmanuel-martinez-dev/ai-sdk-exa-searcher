'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

interface GenerateTitlesOptions {
    count: number
    tone?: 'formal' | 'casual' | 'technical' | 'investigative'
    focus?: 'news' | 'analysis' | 'opinion' | 'feature'
}

const TitlesSchema = z.object({
    titles: z.array(z.object({
        title: z.string().describe('Un título atractivo y preciso para el artículo'),
        reason: z.string().describe('Breve explicación de por qué este título es efectivo')
    }))
})

export async function generateTitles(
    originalContent: string,
    options: GenerateTitlesOptions
) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno')
    }

    const { count, tone = 'formal', focus = 'news' } = options

    if (count < 1 || count > 10) {
        throw new Error('El número de títulos debe estar entre 1 y 10')
    }

    const systemPrompt = `
    Eres un experto en periodismo y marketing de contenidos especializado en crear títulos atractivos y efectivos.
    
    Tu tarea es generar títulos alternativos para un artículo basándote en su contenido.
    
    INSTRUCCIONES:
    - Tono: ${tone === 'formal' ? 'profesional y serio' : tone === 'casual' ? 'accesible y conversacional' : tone === 'technical' ? 'técnico y especializado' : 'investigativo y analítico'}
    - Enfoque: ${focus === 'news' ? 'informativo y directo' : focus === 'analysis' ? 'analítico y profundo' : focus === 'opinion' ? 'editorial y persuasivo' : 'narrativo y envolvente'}
    - Cantidad: Genera exactamente ${count} títulos únicos y diversos
    
    REGLAS PARA TÍTULOS EFECTIVOS:
    - Máximo 80 caracteres por título
    - Debe ser claro y específico
    - Incluir palabras clave relevantes
    - Generar curiosidad sin ser clickbait
    - Variar el estilo entre los títulos (pregunta, declaración, número, etc.)
    - Cada título debe tener un enfoque ligeramente diferente
    
    TIPOS DE TÍTULOS A CONSIDERAR:
    - Títulos directos e informativos
    - Títulos con números o estadísticas
    - Títulos en forma de pregunta
    - Títulos que destacan beneficios o consecuencias
    - Títulos que generan urgencia o curiosidad
    - Títulos que incluyen palabras de acción
    
    Para cada título, proporciona una breve explicación de por qué es efectivo.`

    const userPrompt = `
    Basándote en el siguiente contenido del artículo, genera ${count} títulos alternativos diversos y atractivos:
    
    CONTENIDO DEL ARTÍCULO:
    ${originalContent.slice(0, 2000)}${originalContent.length > 2000 ? '...' : ''}
    
    Genera títulos que capturen la esencia del contenido desde diferentes ángulos y perspectivas.`

    try {
        const result = await generateObject({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            prompt: userPrompt,
            schema: TitlesSchema,
            temperature: 0.8, // Mas creatividad
        })

        return {
            titles: result.object.titles,
            metadata: {
                originalContentLength: originalContent.length,
                options,
                generatedAt: new Date().toISOString(),
            }
        }
    } catch (error) {
        console.error('Error generating titles:', error)
        throw new Error('Error al generar los títulos. Por favor, intentá de nuevo.')
    }
} 
