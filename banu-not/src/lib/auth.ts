import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
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
