'use server';

interface ExaSearchResult {
    title: string;
    url: string;
    publishedDate: string;
    author: string;
    score: number;
    id: string;
    image?: string;
    favicon?: string;
    text?: string;
    highlights?: string[];
    highlightScores?: number[];
    summary?: string;
    subpages?: Array<{
        id: string;
        url: string;
        title: string;
        author: string;
        publishedDate: string;
        text: string;
        summary: string;
        highlights: string[];
        highlightScores: number[];
    }>;
    extras?: {
        links: string[];
    };
}

interface ExaSearchResponse {
    requestId: string;
    resolvedSearchType: string;
    results: ExaSearchResult[];
    searchType: string;
    context?: string;
    costDollars: {
        total: number;
        breakDown: Array<{
            search: number;
            contents: number;
            breakdown: {
                keywordSearch: number;
                neuralSearch: number;
                contentText: number;
                contentHighlight: number;
                contentSummary: number;
            };
        }>;
        perRequestPrices: {
            neuralSearch_1_25_results: number;
            neuralSearch_26_100_results: number;
            neuralSearch_100_plus_results: number;
            keywordSearch_1_100_results: number;
            keywordSearch_100_plus_results: number;
        };
        perPagePrices: {
            contentText: number;
            contentHighlight: number;
            contentSummary: number;
        };
    };
}

export async function askExa(query: string): Promise<ExaSearchResponse> {
    const apiKey = process.env.EXA_API_KEY;

    if (!apiKey) {
        throw new Error('EXA_API_KEY no está configurada en las variables de entorno');
    }

    if (!query.trim()) {
        throw new Error('La consulta no puede estar vacía');
    }

    try {
        const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query.trim(),
                text: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en la API de Exa: ${response.status} ${response.statusText}`);
        }

        const data: ExaSearchResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error al buscar en Exa:', error);
        throw new Error('Error al realizar la búsqueda. Por favor, inténtalo de nuevo.');
    }
}
