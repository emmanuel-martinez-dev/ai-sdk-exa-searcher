## Gotham.ai - motor de búsqueda IA.

Podes probar el proyecto en [gotham.ai](https://ai-sdk-exa-searcher.vercel.app/)

### 🎥 Demo

https://github.com/user-attachments/assets/e8dc0795-5512-4994-b4ad-791e49680ad2

Agregá estas variables de entorno en el proyecto.

Generá tu Exa api key [acá](https://dashboard.exa.ai/login?redirect=/api-keys).
Generá tu OpenAI api key [acá](https://platform.openai.com/settings/organization/api-keys).

```bash
EXA_API_KEY=

OPENAI_API_KEY=
```

Instalar y correr el proyecto:
```bash
pnpm install
# correr server local
pnpm dev
# o
npm install
# correr server local
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu browser para ver el resultado.

## Stack:
- Next.js v15
- Tailwind CSS v4
- Shadcn/ui
- ai-sdk

## Server y Client components
- Server actions de Exa y ai-sdk.
- En actions/exa-actions esta el server action search-web.ts para buscar un tema usando Exa.
- En actions/vercel-actions esta el server action generate-article.ts.
- En app/dashboard/pages.tsx se usa el hook useChat() apuntando al app/api/chat.route.tsx, este ultimo archivo llama al server action generate-article.ts.
- El [dashboard](https://ui.shadcn.com/blocks) fue instalado usando el comando pnpm dlx shadcn@latest dashboard-01.

## Mejoras futuras:

- Base de datos relacional: para persistir articulos generados por los usuarios, usaria algun servicio Postgres serverless como [NeonDB](https://neon.tech) o [Supabase](https://supabase.com).
- Autenticacion: agregar autenticacion para mejorar la seguridad en produccion, usaría [better-auth](https://better-auth.com), [auth0](https://auth0.com) o [clerk](https://clerk.com).
- Todas las opciones de Exa: agregar el crawling, answer y research de la API de Exa.
- Memoria e historial de chat, agregar memoria/historial de chat para Exa, para mejorar la conversacion en el chat y lograr un flujo de conversacion como en Perplexity, por ejemplo.
- Botón de feedback: agregar un botón que abra un dialog de shadcn/ui donde los usuarios puedan proponer mejoras o reportar erores.
