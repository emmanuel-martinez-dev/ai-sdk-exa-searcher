'use server';

import { getLastYearDate, getCurrentDate } from "@/lib/utils/index";

interface ExaSearchResult {
    id: string;
    title: string;
    url: string;
    publishedDate: string;
    author: string;
    text?: string;
    summary?: string;
    image?: string;
    favicon?: string;
}

interface ExaSearchResponse {
    requestId: string;
    autopromptString: string;
    resolvedSearchType: string;
    results: ExaSearchResult[];
    searchTime: number;
    costDollars: {
        total: number;
        search: {
            neural: number;
        };
        contents: {
            text: number;
            summary: number;
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
                type: "auto", // Es el search type: 'auto', 'neural', 'keyword'.
                // Obtener resultados del ultimo año por defecto. Luego el user podria seleccionar el rango de fechas.
                startPublishedDate: getLastYearDate(),
                endPublishedDate: getCurrentDate(),
                contents: {
                    text: true,
                    summary: true,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en la API de Exa: ${response.status} ${response.statusText}`);
        }
        const data: ExaSearchResponse = await response.json();

        /*
        "No vale la pena expandir":
        Algunos resultados arrancan con "I am sorry",
        estos resultados no tienen datos relevantes a la busqueda del user.
        El "I am sorry[...]" es un mensaje de la IA de Exa al no poder encontrar resultados relevantes.
        Por lo tanto los excluyo.
        */
        const filteredResults = data.results.filter((result: ExaSearchResult) => {
            if (result.summary && result.summary.trim().startsWith("I am sorry")) {
                return false; // Excluir este resultado
            }
            return true; // Mantener este resultado
        });

        // Crear respuesta con resultados filtrados
        const filteredResponse: ExaSearchResponse = {
            ...data,
            results: filteredResults
        };

        console.log(`Resultados originales: ${data.results.length}, Resultados filtrados: ${filteredResults.length}`);

        console.log(filteredResponse)
        return filteredResponse;
    } catch (error) {
        console.error('Error al buscar en Exa:', error);
        throw new Error('Error al realizar la búsqueda. Por favor, inténtalo de nuevo.');
    }
}
