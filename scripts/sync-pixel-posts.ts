import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco Pixel
const pixelPool = new Pool({
  host: '24.144.88.69',
  port: 5432,
  database: 'waffle_metrics',
  user: 'waffle',
  password: 'waffle_secure_password_2024',
});

// Rate limiting: 180 requests/minute = ~330ms entre cada request
const RATE_LIMIT_DELAY = 350; // ms entre requisições (margem de segurança)
const MAX_RETRIES = 3;

// Função auxiliar para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Configuração da API Beehiiv
const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || '';

// Focar apenas na publicação "thenews"
const PUBLICATION_ID = 'pub_ce78b549-5923-439b-be24-3f24c454bc12';
const PUBLICATION_NAME = 'thenews';

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  publish_date?: number; // Unix timestamp
}

// Função para determinar o tipo de edição baseado no título
function getEditionType(title: string): 'morning' | 'night' | 'sunday' {
  const upperTitle = title.toUpperCase();
  if (upperTitle.includes('NIGHT')) return 'night';
  if (upperTitle.includes('SUNDAY')) return 'sunday';
  return 'morning';
}

// Função para buscar dados de um post da API Beehiiv com retry e exponential backoff
async function fetchPostFromBeehiiv(publicationId: string, postId: string, retryCount = 0): Promise<BeehiivPost | null> {
  try {
    // Adicionar prefixo "post_" se não tiver
    const formattedPostId = postId.startsWith('post_') ? postId : `post_${postId}`;

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${formattedPostId}`,
      {
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
        },
      }
    );

    // Rate limit hit - retry with exponential backoff
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const backoffDelay = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
      console.warn(`Rate limit hit for ${postId}. Retrying in ${backoffDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await delay(backoffDelay);
      return fetchPostFromBeehiiv(publicationId, postId, retryCount + 1);
    }

    if (!response.ok) {
      if (response.status === 404) {
        // Post não encontrado nesta publicação - normal
        return null;
      }
      console.error(`Failed to fetch post ${postId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}

// Função para salvar metadados do post no banco Pixel
async function savePostMetadata(
  postId: string,
  title: string,
  editionType: 'morning' | 'night' | 'sunday',
  publishDate: number | null,
  publicationId: string,
  subtitle?: string
) {
  // Converter Unix timestamp para Date do PostgreSQL
  const publishDateObj = publishDate ? new Date(publishDate * 1000) : null;

  const query = `
    INSERT INTO posts_metadata (post_id, title, edition_type, publish_date, publication_id, subtitle)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (post_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      edition_type = EXCLUDED.edition_type,
      publish_date = EXCLUDED.publish_date,
      subtitle = EXCLUDED.subtitle,
      updated_at = CURRENT_TIMESTAMP
  `;

  await pixelPool.query(query, [
    postId,
    title,
    editionType,
    publishDateObj,
    publicationId,
    subtitle || null,
  ]);
}

// Função principal de sincronização
async function syncPixelPosts() {
  try {
    console.log('🔄 Starting pixel posts synchronization...');
    console.log('🔑 API Key:', BEEHIIV_API_KEY ? `${BEEHIIV_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('📚 Publication:', PUBLICATION_NAME, '(' + PUBLICATION_ID + ')');

    // Buscar todos os post_ids únicos do pixel_tracking_optimized
    // Filtrar apenas UUIDs válidos (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const { rows: postIds } = await pixelPool.query(`
      SELECT DISTINCT post_id
      FROM pixel_tracking_optimized
      WHERE post_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ORDER BY post_id
    `);

    console.log(`📊 Found ${postIds.length} unique valid posts to sync`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    // Para cada post, buscar na publicação thenews
    for (const { post_id } of postIds) {
      try {
        const postData = await fetchPostFromBeehiiv(PUBLICATION_ID, post_id);

        if (postData) {
          const editionType = getEditionType(postData.title);
          await savePostMetadata(
            post_id,
            postData.title,
            editionType,
            postData.publish_date || null,
            PUBLICATION_ID,
            postData.subtitle
          );
          synced++;
          console.log(`✅ Synced: ${post_id} - ${postData.title} (${editionType})`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped: ${post_id} (not found)`);
        }

        // Delay para respeitar rate limit
        await delay(RATE_LIMIT_DELAY);

        // Delay entre posts para não sobrecarregar a API
        if (synced % 10 === 0) {
          console.log(`Progress: ${synced + skipped + errors}/${postIds.length}`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${post_id}:`, error);
      }
    }

    console.log('\n✨ Synchronization completed!');
    console.log(`✅ Synced: ${synced}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pixelPool.end();
  }
}

// Executar o script
syncPixelPosts();
