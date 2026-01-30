// Netlify Function para manejar stats del blog
// Requiere configurar las variables de entorno:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

const { createClient } = require('@supabase/supabase-js');

// Stats originales (mínimos)
const ORIGINAL_STATS = {
  'post-gas-soldar': { views: 7, comments: 0, likes: 1 },
  'post-oxigeno-industria': { views: 12, comments: 0, likes: 1 },
  'post-argon-industria': { views: 39, comments: 0, likes: 4 },
  'post-soldadura-certificada': { views: 12, comments: 0, likes: 5 },
  'post-oxigeno-diferencia': { views: 38, comments: 0, likes: 3 },
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Verificar variables de entorno
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase not configured' }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const path = event.path.replace('/.netlify/functions/stats', '');
    const method = event.httpMethod;

    // GET /stats - Obtener todos los stats
    if (method === 'GET' && (path === '' || path === '/')) {
      const { data, error } = await supabase
        .from('blog_stats')
        .select('*');

      if (error) throw error;

      // Combinar con stats originales
      const stats = {};
      Object.keys(ORIGINAL_STATS).forEach(postId => {
        const dbStats = data?.find(d => d.post_id === postId);
        stats[postId] = {
          views: (ORIGINAL_STATS[postId].views || 0) + (dbStats?.views || 0),
          likes: (ORIGINAL_STATS[postId].likes || 0) + (dbStats?.likes || 0),
          comments: dbStats?.comments || 0,
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats),
      };
    }

    // POST /stats/view - Incrementar views
    if (method === 'POST' && path === '/view') {
      const { postId, visitorId } = JSON.parse(event.body);

      // Verificar si este visitante ya vio este post
      const { data: existing } = await supabase
        .from('blog_views')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .single();

      if (!existing) {
        // Registrar la vista
        await supabase
          .from('blog_views')
          .insert({ post_id: postId, visitor_id: visitorId });

        // Incrementar contador
        const { data: currentStats } = await supabase
          .from('blog_stats')
          .select('views')
          .eq('post_id', postId)
          .single();

        if (currentStats) {
          await supabase
            .from('blog_stats')
            .update({ views: currentStats.views + 1 })
            .eq('post_id', postId);
        } else {
          await supabase
            .from('blog_stats')
            .insert({ post_id: postId, views: 1, likes: 0, comments: 0 });
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    // POST /stats/like - Toggle like
    if (method === 'POST' && path === '/like') {
      const { postId, visitorId } = JSON.parse(event.body);

      // Verificar si ya dio like
      const { data: existing } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .single();

      const { data: currentStats } = await supabase
        .from('blog_stats')
        .select('likes')
        .eq('post_id', postId)
        .single();

      let newLikes = currentStats?.likes || 0;
      let liked = false;

      if (existing) {
        // Quitar like
        await supabase
          .from('blog_likes')
          .delete()
          .eq('id', existing.id);
        newLikes = Math.max(0, newLikes - 1);
      } else {
        // Agregar like
        await supabase
          .from('blog_likes')
          .insert({ post_id: postId, visitor_id: visitorId });
        newLikes += 1;
        liked = true;
      }

      // Actualizar contador
      if (currentStats) {
        await supabase
          .from('blog_stats')
          .update({ likes: newLikes })
          .eq('post_id', postId);
      } else {
        await supabase
          .from('blog_stats')
          .insert({ post_id: postId, views: 0, likes: newLikes, comments: 0 });
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ liked, likes: newLikes + ORIGINAL_STATS[postId]?.likes || 0 }),
      };
    }

    // POST /stats/comment - Agregar comentario
    if (method === 'POST' && path === '/comment') {
      const { postId, name, email, text } = JSON.parse(event.body);

      // Insertar comentario
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          name,
          email,
          text,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Actualizar contador de comentarios
      const { count } = await supabase
        .from('blog_comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      await supabase
        .from('blog_stats')
        .upsert({
          post_id: postId,
          comments: count,
        }, { onConflict: 'post_id' });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, comment: data[0] }),
      };
    }

    // GET /stats/comments/:postId - Obtener comentarios
    if (method === 'GET' && path.startsWith('/comments/')) {
      const postId = path.replace('/comments/', '');

      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || []),
      };
    }

    // GET /stats/check-like/:postId/:visitorId - Verificar si dio like
    if (method === 'GET' && path.startsWith('/check-like/')) {
      const parts = path.replace('/check-like/', '').split('/');
      const postId = parts[0];
      const visitorId = parts[1];

      const { data } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .single();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ liked: !!data }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
