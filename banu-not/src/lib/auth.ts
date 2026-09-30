import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-posta ve şifre gereklidir.');
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(
          credentials.email.toLowerCase().trim()
        ) as any;

        if (!user) {
          throw new Error('Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.');
        }

        if (user.is_banned) {
          throw new Error('Hesabınız askıya alınmıştır. Destek ile iletişime geçin.');
        }

        if (!user.is_active) {
          throw new Error('Hesabınız aktif değil.');
        }

        if (!user.password_hash) {
          throw new Error('Lütfen Google ile giriş yapın.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isPasswordValid) {
          throw new Error('Şifre hatalı. Lütfen tekrar deneyin.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.role,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = (user.email || '').toLowerCase().trim();
        const db = getDb();
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        
        if (!existingUser) {
          // Yeni kayıtlarda uzantı kontrolü yap, ama eski (veritabanında olan) admin/kullanıcıların girişine izin ver.
          if (!email.endsWith('@ogr.bandirma.edu.tr')) {
            return '/giris?error=Sisteme sadece @ogr.bandirma.edu.tr uzantılı öğrenci e-postaları ile kayıt olunabilir.';
          }
          // Register new user via Google
          db.prepare(`
            INSERT INTO users (id, email, password_hash, display_name, avatar_url, university_id, role, is_active)
            VALUES (?, ?, '', ?, ?, ?, 'user', 1)
          `).run(
            uuidv4(),
            user.email,
            user.name || 'Google User',
            user.image || null,
            null // Needs to select university later
          );
        } else if (existingUser.is_banned) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (trigger === 'update' && token?.email) {
        // Fetch latest profile when update() is called
        const db = getDb();
        const dbUser = db.prepare('SELECT id, role, university_id FROM users WHERE email = ?').get(token.email) as any;
        if (dbUser) {
          token.universityId = dbUser.university_id;
        }
      }

      if (account?.provider === 'google' && user?.email) {
        const db = getDb();
        const dbUser = db.prepare('SELECT id, role, university_id FROM users WHERE email = ?').get(user.email) as any;
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.universityId = dbUser.university_id;
        }
      } else if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        // Check for manual login user
        const db = getDb();
        const dbUser = db.prepare('SELECT university_id FROM users WHERE id = ?').get(user.id) as any;
        if (dbUser) {
          token.universityId = dbUser.university_id;
        }
      }

      // If token still doesn't have universityId, fetch it just in case
      if (!token.universityId && token.email) {
        const db = getDb();
        const dbUser = db.prepare('SELECT university_id FROM users WHERE email = ?').get(token.email) as any;
        if (dbUser) {
          token.universityId = dbUser.university_id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).universityId = token.universityId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/giris',
    error: '/giris',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
