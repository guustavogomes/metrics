import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pixelPool = new Pool({
  host: '24.144.88.69',
  port: 5432,
  database: 'waffle_metrics',
  user: 'waffle',
  password: 'waffle_secure_password_2024',
});

const RATE_LIMIT_DELAY = 350;
const MAX_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || '';

let PUBLICATIONS: Record<string, string> = {};
try {
  const pubsJson = process.env.BEEHIIV_PUBLICATIONS || '{}';
  PUBLICATIONS = JSON.parse(pubsJson);
} catch (error) {
  console.error('Error parsing BEEHIIV_PUBLICATIONS:', error);
  PUBLICATIONS = {
    thenews: 'pub_ce78b549-5923-439b-be24-3f24c454bc12',
  };
}

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  publish_date?: string;
}

function getEditionType(title: string): 'morning' | 'night' {
  return title.toUpperCase().includes('NIGHT') ? 'night' : 'morning';
}

async function fetchPostFromBeehiiv(publicationId: string, postId: string, retryCount = 0): Promise<BeehiivPost | null> {
  try {
    const formattedPostId = postId.startsWith('post_') ? postId : `post_${postId}`;

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${formattedPostId}`,
      {
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
        },
      }
    );

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const backoffDelay = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
      console.warn(`Rate limit hit for ${postId}. Retrying in ${backoffDelay}ms...`);
      await delay(backoffDelay);
      return fetchPostFromBeehiiv(publicationId, postId, retryCount + 1);
    }

    if (!response.ok) {
      if (response.status === 404) {
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

async function savePostMetadata(
  postId: string,
  title: string,
  editionType: 'morning' | 'night',
  publishDate: string | null,
  publicationId: string,
  subtitle?: string
) {
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
    publishDate,
    publicationId,
    subtitle || null,
  ]);
}

async function syncPixelPosts() {
  try {
    console.log('🔄 Starting TEST pixel posts synchronization (first 10 posts)...');
    console.log('🔑 API Key:', BEEHIIV_API_KEY ? `${BEEHIIV_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('📚 Publications:', Object.keys(PUBLICATIONS).length, Object.keys(PUBLICATIONS));

    const { rows: postIds } = await pixelPool.query(`
      SELECT DISTINCT post_id
      FROM pixel_tracking_optimized
      WHERE post_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ORDER BY post_id
      LIMIT 10
    `);

    console.log(`📊 Found ${postIds.length} unique valid posts to sync\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const { post_id } of postIds) {
      try {
        let postData: BeehiivPost | null = null;
        let foundPublicationId = '';

        for (const [pubName, pubId] of Object.entries(PUBLICATIONS)) {
          postData = await fetchPostFromBeehiiv(pubId, post_id);
          if (postData) {
            foundPublicationId = pubId;
            break;
          }
          await delay(RATE_LIMIT_DELAY);
        }

        if (postData) {
          const editionType = getEditionType(postData.title);
          await savePostMetadata(
            post_id,
            postData.title,
            editionType,
            postData.publish_date || null,
            foundPublicationId,
            postData.subtitle
          );
          synced++;
          console.log(`✅ Synced: ${post_id} - ${postData.title} (${editionType})`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped: ${post_id} (not found)`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${post_id}:`, error);
      }
    }

    console.log('\n✨ Test synchronization completed!');
    console.log(`✅ Synced: ${synced}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pixelPool.end();
  }
}

syncPixelPosts();
