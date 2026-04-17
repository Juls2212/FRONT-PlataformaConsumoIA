# Frontend

Frontend en Next.js para la demo del proyecto de patrones de software sobre consumo de IA con control de cuotas y rate limiting.

## Variables de entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Vercel

1. Sube el contenido de `FRONTEND` a tu repositorio.
2. En Vercel, crea un nuevo proyecto e importa ese repositorio.
3. Configura el proyecto como Next.js.
4. En `Environment Variables`, agrega `NEXT_PUBLIC_API_BASE_URL` con la URL pública del backend.
5. Ejecuta el deploy.
6. Si cambias la URL del backend después, vuelve a desplegar para que el frontend tome el nuevo valor.
