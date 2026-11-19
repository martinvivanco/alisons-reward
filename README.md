# Tabla de Premios de Alison

Cartilla pública de 50 recuadros. Cada sticker suma y los recuadros 5, 15, 30 y 50 dan premio.

- **Página pública:** https://martinvivanco.github.io/alisons-reward/
- **Modo admin:** https://martinvivanco.github.io/alisons-reward/?admin

## Stack

- HTML, CSS y JS sin build, publicado en **GitHub Pages**.
- **Supabase** (Postgres + Auth) para guardar los stickers.
  - Lectura pública.
  - Escritura solo para `martin.vivanco.10@gmail.com`, validada con RLS en la base de datos.

```
index.html
css/styles.css
js/config.js           ← premios, tipos de sticker, claves públicas
js/app.js              ← lógica (carga, render, admin, celebración)
assets/stickers/       ← Polar, Sapi, Copito (WebP troquelados)
supabase/schema.sql    ← tabla, reglas de seguridad y sticker inicial
supabase/migrations/   ← cambios sobre una base ya creada (ej. 002: sticker "Niña buena")
```

## Puesta en marcha (una sola vez)

### 1. Base de datos

1. En Supabase, abre **SQL Editor → New query**.
2. Pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Revisa en **Table Editor → stickers** que haya una fila `polar`.

### 2. Usuario admin

1. Ve a **Authentication → Users → Add user → Create new user**.
2. Usa el correo `martin.vivanco.10@gmail.com`, una contraseña tuya y marca **Auto Confirm User**.
3. Ve a **Authentication → Sign In / Providers** y **desactiva "Allow new users to sign up"**.

Aunque alguien lograra registrarse, la base de datos solo acepta cambios de tu correo.

### 3. Publicar en GitHub Pages

```bash
cd ~/Documents/"Rewards project"
git init -b main
git add .
git commit -m "Tabla de Premios de Alison"
git remote add origin https://github.com/martinvivanco/alisons-reward.git
git push -u origin main
```

Luego, en GitHub, ve a **Settings → Pages → Build and deployment** y elige:

- **Source:** Deploy from a branch
- **Branch:** `main` / `/ (root)`

Pulsa **Save**. En uno o dos minutos la página queda publicada.

## Uso diario

1. Abre `…/alisons-reward/?admin` en tu celular e inicia sesión. Solo la primera vez: la sesión queda guardada.
2. Pulsa **+ Polar**, **+ Sapi** o **+ Copito**. Si te equivocas, usa **↶ Deshacer**, que quita el último sticker.

Tip: en Safari, **Compartir → Agregar a inicio** te deja un ícono directo.

Para quien solo mira:

- Tocar un sticker muestra qué fue y en qué fecha se ganó.
- Si se alcanzó un premio desde su última visita, ve el confeti al entrar.

## Cambios comunes

- **Premios o recuadros:** edita `MILESTONES` en `js/config.js`.
- **Nuevo tipo de sticker:**
  1. Agrega la imagen en `assets/stickers/`.
  2. Agrégalo en `TYPES` en `js/config.js`.
  3. Agrega su id al `check (type in (...))` de la tabla con un `ALTER TABLE` en Supabase.
- **Reiniciar la cartilla:** en el SQL Editor ejecuta `truncate public.stickers restart identity;`.

## Notas

- **La clave de `config.js`** es la *publishable* y es pública por diseño. **Nunca** subas la clave `secret` / `service_role`.
- **Proyectos inactivos:** el plan gratis de Supabase pausa un proyecto tras ~7 días sin actividad. Con uso frecuente no pasa, y si pasa se reactiva desde el panel.
