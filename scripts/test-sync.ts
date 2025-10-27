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
const PUBLICATION_ID = 'pub_ce78b549-5923-439b-be24-3f24c454bc12'; // thenews

async function test() {
  console.log('🔑 API Key:', BEEHIIV_API_KEY ? `${BEEHIIV_API_KEY.substring(0, 10)}...` : 'NOT SET');

  const { rows } = await pixelPool.query(
    "SELECT DISTINCT post_id FROM pixel_tracking_optimized WHERE post_id IN ('d2625503-d277-47fa-9fb6-c20f76ff148d', '8fe9403b-5e13-4378-aab0-c86b7ceda7ab') LIMIT 3"
  );

  for (const { post_id } of rows) {
    console.log(`\n📝 Testing post: ${post_id}`);
    const formattedPostId = post_id.startsWith('post_') ? post_id : `post_${post_id}`;
    console.log(`   Formatted: ${formattedPostId}`);

    const url = `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/posts/${formattedPostId}`;
    console.log(`   URL: ${url}`);

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${BEEHIIV_API_KEY}` },
      });

      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Found: ${data.data.title}`);
      } else {
        console.log(`   ❌ Not found or error`);
      }
    } catch (error) {
      console.log(`   ❌ Error:`, error);
    }
  }

  await pixelPool.end();
}

test();
