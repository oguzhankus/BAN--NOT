import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

// Initialize DB and seed on first API call
let initialized = false;

export async function ensureDb() {
  if (!initialized) {
    getDb();
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }
    initialized = true;
  }
  return getDb();
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginateQuery(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return { limit, offset };
}
