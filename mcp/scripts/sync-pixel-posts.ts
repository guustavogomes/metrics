import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pixelPool = new Pool({
  host: process.env.PIXEL_DB_HOST || "24.144.88.69",
  port: parseInt(process.env.PIXEL_DB_PORT || "5432"),
  database: process.env.PIXEL_DB_NAME || "waffle_metrics",
  user: process.env.PIXEL_DB_USER || "waffle",
  password: process.env.PIXEL_DB_PASSWORD || "waffle_secure_password_2024",
});

const RATE_LIMIT_DELAY = 350;
const MAX_RETRIES = 3;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || "";
const PUBLICATION_ID = "pub_ce78b549-5923-439b-be24-3f24c454bc12";

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  publish_date?: number;
}

function getEditionType(title: string): "morning" | "night" | "sunday" {
  const upperTitle = title.toUpperCase();
  if (upperTitle.includes("NIGHT")) return "night";
  if (upperTitle.includes("SUNDAY")) return "sunday";
  return "morning";
}

async function fetchPostFromBeehiiv(
  publicationId: string,
  postId: string,
  retryCount = 0
): Promise<BeehiivPost | null> {
  try {
    const formattedPostId = postId.startsWith("post_") ? postId : `post_${postId}`;

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${formattedPostId}`,
      {
        headers: {
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
      }
    );

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const backoffDelay = RATE_LIMIT_DELAY * Math.pow(2, retryCount);
      console.warn(`Rate limit hit. Retrying in ${backoffDelay}ms...`);
      await delay(backoffDelay);
      return fetchPostFromBeehiiv(publicationId, postId, retryCount + 1);
    }

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`Failed to fetch post ${postId}: ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}

async function savePostMetadata(
  postId: string,
  title: string,
  editionType: "morning" | "night" | "sunday",
  publishDate: number | null,
  publicationId: string,
  subtitle?: string
) {
  const publishDateObj = publishDate ? new Date(publishDate * 1000) : null;

  await pixelPool.query(
    `INSERT INTO posts_metadata (post_id, title, edition_type, publish_date, publication_id, subtitle)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (post_id)
     DO UPDATE SET
       title = EXCLUDED.title,
       edition_type = EXCLUDED.edition_type,
       publish_date = EXCLUDED.publish_date,
       subtitle = EXCLUDED.subtitle,
       updated_at = CURRENT_TIMESTAMP`,
    [postId, title, editionType, publishDateObj, publicationId, subtitle || null]
  );
}

async function syncPixelPosts() {
  try {
    console.log("🔄 Iniciando sincronização de posts...");
    console.log(`📅 Data/Hora: ${new Date().toISOString()}`);

    if (!BEEHIIV_API_KEY) {
      console.error("❌ BEEHIIV_API_KEY não configurada!");
      process.exit(1);
    }

    const { rows: postIds } = await pixelPool.query(`
      SELECT DISTINCT post_id
      FROM pixel_tracking_optimized
      WHERE post_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      ORDER BY post_id
    `);

    console.log(`📊 Encontrados ${postIds.length} posts únicos`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

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
          if (synced % 10 === 0) {
            console.log(`✅ Sincronizados: ${synced}/${postIds.length}`);
          }
        } else {
          skipped++;
        }

        await delay(RATE_LIMIT_DELAY);
      } catch (error) {
        errors++;
        console.error(`❌ Erro ao processar ${post_id}:`, error);
      }
    }

    console.log("\n✨ Sincronização concluída!");
    console.log(`✅ Sincronizados: ${synced}`);
    console.log(`⏭️  Ignorados: ${skipped}`);
    console.log(`❌ Erros: ${errors}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  } finally {
    await pixelPool.end();
  }
}

syncPixelPosts();
