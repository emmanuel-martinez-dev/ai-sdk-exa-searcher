## Gotham.ai - motor de búsqueda IA.

First, run the development server:
```bash
EXA_API_KEY=your_exa_api_key_here

OPENAI_API_KEY=your_openai_api_key_here
```

```bash
pnpm install
# run local server
pnpm dev
# or
npm install
# run local server
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu browser para ver el resultado.

# Mejoras futuras:

- Base de datos relacional: para persistir articulos generados por los usuarios, usaria algun servicio Postgres serverless como [NeonDB](https://neon.tech) o [Supabase](https://supabase.com).
- Autenticacion: agregar autenticacion para mejorar la seguridad en produccion, usaría [better-auth](https://better-auth.com), [auth0](https://auth0.com) o [clerk](https://clerk.com).
- Todas las opciones de Exa: agregar el crawling, answer y research de la API de Exa.
- Memoria e historial de chat, agregar memoria/historial de chat para Exa, para mejorar la conversacion en el chat y lograr un flujo de conversacion como en Perplexity, por ejemplo.
- Botón de feedback: agregar un botón que abra un dialog de shadcn/ui donde los usuarios puedan proponer mejoras o reportar erores.

