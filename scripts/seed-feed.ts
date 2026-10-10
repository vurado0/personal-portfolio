// npm run seed:feed — writes 4 sample feed posts (one per type) to Firestore.
//
// Emulator (recommended for testing):
//   firebase emulators:start --only auth,firestore --project demo-portfolio
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-portfolio npm run seed:feed
// Real project: set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON (never commit it)
// and FIREBASE_PROJECT_ID. The Admin SDK bypasses security rules.
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-portfolio';
if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set FIRESTORE_EMULATOR_HOST (emulator) or GOOGLE_APPLICATION_CREDENTIALS (real project).');
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();
const hoursAgo = (h: number) => Timestamp.fromDate(new Date(Date.now() - h * 3_600_000));
// Cloudinary's public demo images — replace with your own uploads.
const demo = (id: string) => `https://res.cloudinary.com/demo/image/upload/${id}`;

const posts = [
  {
    type: 'photo',
    text: 'SAMPLE — Morning espresso before the networking lab.',
    images: [
      { url: demo('coffee_cup.jpg'), publicId: 'sample/coffee-cup', width: 1600, height: 1067, alt: 'A cup of coffee seen from above' },
      { url: demo('samples/coffee.jpg'), publicId: 'sample/coffee', width: 1600, height: 1067, alt: 'Coffee beans and a cup' },
    ],
    tags: ['coffee', 'study'],
    skills: ['networking'],
    mood: '☕ awake',
    createdAt: hoursAgo(2),
  },
  {
    type: 'text',
    text: 'SAMPLE — Finally understood why containers on the default bridge cannot resolve each other by name.',
    images: [],
    tags: ['docker', 'til'],
    skills: ['docker'],
    createdAt: hoursAgo(20),
  },
  {
    type: 'achievement',
    text: 'SAMPLE — Finished the Docker networking chapter',
    badge: '🏆',
    images: [],
    tags: ['docker', 'progress'],
    skills: ['docker', 'linux'],
    mood: 'proud',
    createdAt: hoursAgo(30),
  },
  {
    type: 'music',
    text: 'SAMPLE — On repeat while writing this website.',
    images: [],
    music: {
      provider: 'spotify',
      url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      embedUrl: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0',
      title: 'Sample track',
      artist: 'Sample artist',
      coverUrl: demo('docs/models.jpg'),
    },
    tags: ['music'],
    skills: [],
    mood: '🎧 deep focus',
    createdAt: hoursAgo(50),
  },
];

for (const p of posts) {
  const ref = await db.collection('posts').add({ published: true, ...p, updatedAt: FieldValue.serverTimestamp() });
  console.log(`+ ${p.type.padEnd(12)} posts/${ref.id}`);
}
console.log(`Seeded ${posts.length} posts into ${projectId}${process.env.FIRESTORE_EMULATOR_HOST ? ' (emulator)' : ''}.`);
