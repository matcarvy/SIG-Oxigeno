# 🚀 Configuración del Blog SIG con Stats Interactivos

## Prerequisitos
- Cuenta en [Netlify](https://netlify.com)
- Cuenta en [Supabase](https://supabase.com) (gratis)

---

## 📦 1. Configurar Supabase

### 1.1 Crear proyecto
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se configure (~2 minutos)

### 1.2 Crear tablas
1. Ve a **SQL Editor** en el panel de Supabase
2. Copia y pega el contenido de `supabase-schema.sql`
3. Click en **Run** para ejecutar

### 1.3 Obtener credenciales
1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public key** (empieza con `eyJ...`)

---

## 🌐 2. Desplegar en Netlify

### 2.1 Subir sitio
1. Comprime todos los archivos en un ZIP
2. Ve a [netlify.com](https://app.netlify.com)
3. Arrastra el ZIP a "Deploy manually"

### 2.2 Configurar variables de entorno
1. Ve a **Site settings** → **Environment variables**
2. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiI...` |

3. Redeploy el sitio para aplicar cambios

---

## ✅ 3. Verificar funcionamiento

1. Abre tu sitio en Netlify
2. Ve a la página del Blog
3. Prueba:
   - **👁️ Views**: Click en un post → el contador debe aumentar
   - **❤️ Likes**: Click en corazón → debe cambiar de color y aumentar
   - **💬 Comments**: Click en comentarios → modal para escribir

---

## 📊 Estructura de la base de datos

```
blog_stats       → Contadores por post (views, likes, comments)
blog_views       → Registro de vistas únicas por visitante
blog_likes       → Registro de likes por visitante
blog_comments    → Comentarios con nombre, email, texto
```

---

## 🔧 Solución de problemas

### "Supabase not configured"
- Verifica que las variables de entorno estén configuradas
- Redeploy después de agregar las variables

### Los stats no se actualizan
- Revisa la consola del navegador (F12) para ver errores
- Verifica que las tablas se crearon correctamente en Supabase

### Error de CORS
- El archivo `netlify.toml` ya tiene los headers configurados
- Si persiste, verifica que el archivo esté en la raíz

---

## 📁 Archivos incluidos

```
├── netlify.toml           # Configuración de Netlify
├── package.json           # Dependencias
├── supabase-schema.sql    # Schema de base de datos
├── netlify/
│   └── functions/
│       └── stats.js       # API de stats
└── *.html                 # Páginas del sitio
```
