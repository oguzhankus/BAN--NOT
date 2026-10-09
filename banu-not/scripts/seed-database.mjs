if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed üretim ortamında çalıştırılamaz.');
}

const [{ getDb }, { seedDatabase }] = await Promise.all([
  import('../src/lib/db.ts'),
  import('../src/lib/seed.ts'),
]);

try {
  await seedDatabase();
} finally {
  getDb().close();
}
