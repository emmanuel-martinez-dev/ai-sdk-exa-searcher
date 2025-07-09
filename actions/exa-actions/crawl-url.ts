'use server';

interface ExaCrawlResult {
    id: string;
    title: string;
    url: string;
    author: string;
    text: string;
    image?: string;
    favicon?: string;
}

interface ExaCrawlStatus {
    id: string;
    status: string;
    source: string;
}

interface ExaCrawlResponse {
    data: {
        requestId: string;
        results: ExaCrawlResult[];
        statuses: ExaCrawlStatus[];
        costDollars: {
            total: number;
            contents: {
                text: number;
            };
        };
        searchTime: number;
    };
}

export async function crawlUrl(urls: string[]): Promise<ExaCrawlResponse> {
    const apiKey = process.env.EXA_API_KEY;

    if (!apiKey) {
        throw new Error('EXA_API_KEY no está configurada en las variables de entorno');
    }

    if (!urls || urls.length === 0) {
        throw new Error('Se debe proporcionar al menos una URL para crawlear');
    }

    // Valida que las URLs sean válidas
    const validUrls = urls.filter(url => {
        try {
            // Si no tiene protocolo, agrega https://
            const urlToTest = url.startsWith('http') ? url : `https://${url}`;
            new URL(urlToTest);
            return true;
        } catch {
            return false;
        }
    });

    if (validUrls.length === 0) {
        throw new Error('No se proporcionaron URLs válidas');
    }

    try {
        const response = await fetch('https://api.exa.ai/contents', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ids: validUrls,
                text: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en la API de Exa: ${response.status} ${response.statusText}`);
        }

        const data: ExaCrawlResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error al crawlear URLs con Exa:', error);
        throw new Error('Error al crawlear las URLs. Por favor, intentá de nuevo.');
    }
}
