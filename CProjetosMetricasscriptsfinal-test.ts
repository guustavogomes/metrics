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

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || '';
const PUBLICATION_ID = 'pub_ce78b549-5923-439b-be24-3f24c454bc12';

interface BeehiivPost {
  id: string;
  title: string;
  subtitle?: string;
  publish_date?: number;
}

async function test() {
  const testPosts = ['d2625503-d277-47fa-9fb6-c20f76ff148d', '8fe9403b-5e13-4378-aab0-c86b7ceda7ab'];

  for (const post_id of testPosts) {
    const formattedPostId = `post_${post_id}`;
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/posts/${formattedPostId}`,
      {
        headers: { 'Authorization': `Bearer ${BEEHIIV_API_KEY}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const post = data.data as BeehiivPost;
      const editionType = post.title.toUpperCase().includes('NIGHT') ? 'night' : 'morning';
      const publishDateObj = post.publish_date ? new Date(post.publish_date * 1000) : null;

      console.log(`\n✅ Post: ${post.title}`);
      console.log(`   Type: ${editionType}`);
      console.log(`   Publish Date: ${publishDateObj}`);

      // Testar inserção
      try {
        await pixelPool.query(`
          INSERT INTO posts_metadata (post_id, title, edition_type, publish_date, publication_id, subtitle)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (post_id) DO UPDATE SET
            title = EXCLUDED.title,
            edition_type = EXCLUDED.edition_type,
            publish_date = EXCLUDED.publish_date,
            updated_at = CURRENT_TIMESTAMP
        `, [post_id, post.title, editionType, publishDateObj, PUBLICATION_ID, post.subtitle || null]);
        console.log(`   💾 Saved to database!`);
      } catch (error) {
        console.error(`   ❌ Database error:`, error);
      }
    }
  }

  await pixelPool.end();
}

test();
