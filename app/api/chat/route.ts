import { generateArticle } from '@/actions/vercel-actions/generate-article'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const { messages, articleData, options } = body

        // Verificar si tenemos los datos necesarios
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error('No se recibieron mensajes válidos')
            return new Response('No messages provided', { status: 400 })
        }

        if (!articleData) {
            console.error('No se recibieron datos del artículo')
            return new Response('No article data provided', { status: 400 })
        }

        const lastMessage = messages[messages.length - 1]

        if (lastMessage.content === 'generate_article') {
            console.log('Generando artículo con datos:', articleData.title) // Debug

            // Usar el server action existente
            const result = await generateArticle(articleData, options || {})

            // Convertir el textStream a un formato compatible con useChat
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder()
                    try {
                        for await (const chunk of result.textStream) {
                            // Formato esperado por useChat: data stream protocol
                            const formattedChunk = `0:"${chunk.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`
                            controller.enqueue(encoder.encode(formattedChunk))
                        }
                        controller.close()
                    } catch (error) {
                        controller.error(error)
                    }
                }
            })

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            })
        }

        return new Response('Invalid request', { status: 400 })
    } catch (error) {
        console.error('Error in chat API:', error)
        return new Response(`Error al procesar la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`, { status: 500 })
    }
}
