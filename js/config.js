// ===== Configuración de la Tabla de Premios =====
// La clave "publishable" es pública por diseño: la seguridad la dan las reglas RLS en Supabase.
// NUNCA pongas aquí la clave "secret" / "service_role".

export const SUPABASE_URL = "https://jpzmejkxkcintrwtihkg.supabase.co";
export const SUPABASE_KEY = "sb_publishable_xtYCAyZ7-16qZDhmP_FCxw_e5IvHNDU";

// Única cuenta que puede pegar o quitar stickers (también se valida en la base de datos)
export const ADMIN_EMAIL = "martin.vivanco.10@gmail.com";

export const TOTAL = 50;

// El "id" de cada tipo debe coincidir con los valores permitidos en supabase/schema.sql
export const TYPES = {
  polar:  { name: "Polar",  reason: "Comer todo",               color: "#f2f2f2", img: "assets/stickers/polar.webp" },
  sapi:   { name: "Sapi",   reason: "Actividad física del día", color: "#8cc63f", img: "assets/stickers/sapi.webp" },
  copito: { name: "Copito", reason: "Dormir 8 horas",           color: "#6b7486", img: "assets/stickers/copito.webp" },
  nina_buena: { name: "Niña buena", reason: "Portarse bien",   color: "#c9302c", img: "assets/stickers/nina-buena.webp" },
};

// Recuadro -> premio
export const MILESTONES = {
  5:  { label: "Premio",       tier: 1 },
  15: { label: "Súper premio", tier: 2 },
  30: { label: "Mega premio",  tier: 3 },
  50: { label: "Gran premio",  tier: 4 },
};
