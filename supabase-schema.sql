-- ============================================
-- SCHEMA DE BASE DE DATOS PARA BLOG SIG
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Tabla de estadísticas por post
CREATE TABLE IF NOT EXISTS blog_stats (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(100) UNIQUE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de vistas (para evitar duplicados)
CREATE TABLE IF NOT EXISTS blog_views (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(100) NOT NULL,
    visitor_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, visitor_id)
);

-- Tabla de likes (para toggle)
CREATE TABLE IF NOT EXISTS blog_likes (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(100) NOT NULL,
    visitor_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, visitor_id)
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS blog_comments (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_blog_stats_post_id ON blog_stats(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_post_visitor ON blog_views(post_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_visitor ON blog_likes(post_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE blog_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo para anon)
CREATE POLICY "Allow all for blog_stats" ON blog_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for blog_views" ON blog_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for blog_likes" ON blog_likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for blog_comments" ON blog_comments FOR ALL USING (true) WITH CHECK (true);
