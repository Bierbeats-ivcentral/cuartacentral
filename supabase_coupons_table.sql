-- ══════════════════════════════════════════════════════════════
-- IV CENTRAL — Tabla de cupones
-- Ejecutar en Supabase: Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coupons (
  id           bigserial PRIMARY KEY,
  code         text UNIQUE NOT NULL,
  email        text NOT NULL,
  discount_pct integer NOT NULL DEFAULT 10,
  used         boolean NOT NULL DEFAULT false,
  used_at      timestamptz,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsqueda rápida por código
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_email_idx ON coupons (email);

-- Row Level Security: la anon key puede INSERT y SELECT, pero NO puede
-- actualizar "used" libremente — solo via service_role (desde el servidor).
-- Para este setup, usamos una policy permisiva de lectura
-- y la actualización se hace con la anon key (aceptable para MVP).
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Permitir insertar nuevos cupones (al suscribirse)
CREATE POLICY "insert_coupons" ON coupons
  FOR INSERT TO anon WITH CHECK (true);

-- Permitir leer cupones propios por código (para validar al reservar)
CREATE POLICY "select_coupons" ON coupons
  FOR SELECT TO anon USING (true);

-- Permitir marcar como usado
CREATE POLICY "update_coupon_used" ON coupons
  FOR UPDATE TO anon USING (true) WITH CHECK (used = true);
