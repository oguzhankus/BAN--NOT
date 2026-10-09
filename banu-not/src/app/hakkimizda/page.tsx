import Link from 'next/link';
import {
  ArrowRight, BookOpen, GraduationCap, Heart, MessageCircle,
  ShieldCheck, Sparkles, Users
} from 'lucide-react';
import { UNIVERSITY } from '@/lib/constants';
import ScrollReveal from '@/components/ScrollReveal';

const values = [
  {
    icon: BookOpen,
    title: 'Paylaşım',
    description: 'Bilgi paylaşıldıkça çoğalır. Hazırladığın bir not, başka bir öğrencinin öğrenme yolculuğuna ışık tutabilir.',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenilirlik',
    description: 'Moderasyon ve öğrenci değerlendirmeleriyle faydalı, düzenli ve güvenli bir kaynak arşivi oluşturuyoruz.',
  },
  {
    icon: Users,
    title: 'Erişilebilirlik',
    description: 'Aradığın ders kaynağına farklı cihazlardan kolayca ulaşabilmen için sade bir deneyim sunuyoruz.',
  },
];

export default function AboutPage() {
  return (
    <div className="about-page-shell min-h-screen pb-16">
      <section className="about-page-hero relative isolate overflow-hidden text-white">
        <div aria-hidden="true" className="about-page-glow absolute inset-0 -z-10" />
        <div aria-hidden="true" className="about-page-orbit absolute -right-20 -top-36 -z-10 h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="container-app relative max-w-5xl py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-teal-200">
              <GraduationCap className="h-4 w-4" /> {UNIVERSITY.shortName} öğrencilerinden öğrencilere
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              İyi notlar paylaşılır.<br className="hidden sm:block" /> İyi öğrenme <span className="about-accent">birlikte olur.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-navy-200 sm:text-lg sm:leading-8">
              BANÜ NOT, {UNIVERSITY.name} öğrencileri tarafından yine {UNIVERSITY.shortName} öğrencileri için geliştirilmiş, kâr amacı gütmeyen eğitim odaklı bir bilgi paylaşım platformudur.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/kesfet" className="btn btn-teal btn-lg">
                Notları keşfet <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/yukle" className="btn btn-glass btn-lg">
                <BookOpen className="h-4 w-4" /> Bir not paylaş
              </Link>
            </div>
          </div>
          <div className="about-hero-note mt-10 flex max-w-xl items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur sm:mt-14">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/15 text-teal-200"><Heart className="h-5 w-5" /></span>
            <p className="text-sm font-medium leading-6 text-white/85">Birlikte daha güçlüyüz; paylaştıkça herkes için daha iyi öğrenme kaynakları oluşur.</p>
          </div>
        </div>
      </section>

      <div className="container-app max-w-5xl">
        <ScrollReveal className="relative z-10 -mt-7 sm:-mt-10">
          <section className="about-story-card rounded-3xl border border-navy-100 bg-white p-6 shadow-[0_20px_55px_rgba(16,42,67,0.08)] sm:p-9">
            <div className="grid gap-8 md:grid-cols-[0.75fr_1.25fr] md:gap-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Neden başladık?</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Bir not ararken doğan fikir.</h2>
              </div>
              <div className="space-y-4 text-sm leading-7 text-navy-600 sm:text-base">
                <p>
                  Üniversite hayatının zorluklarından biri de kaliteli ders materyallerine, sınav özetlerine ve çıkmış sorulara ulaşmak. Bu notlar çoğu zaman mesaj gruplarında kayboluyor ya da üst sınıflarla iletişim kuramayan öğrencilerin erişiminden uzak kalıyor.
                </p>
                <p>
                  Bu problemi çözmek ve bilginin serbestçe paylaşılmasını kolaylaştırmak için yola çıktık. İstiyoruz ki her öğrenci, vize veya final haftasında aradığı nota tek bir yerden ulaşabilsin.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-3 border-t border-navy-100 pt-6 sm:grid-cols-3">
              {[
                { label: 'Öğrenci odaklı', icon: Users },
                { label: 'Ücretsiz erişim', icon: BookOpen },
                { label: 'Topluluk desteği', icon: MessageCircle },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-navy-50/70 px-4 py-3">
                  <item.icon className="h-4 w-4 text-teal-700" />
                  <span className="text-sm font-semibold text-navy-700">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <section className="py-12 sm:py-16">
          <div className="mb-7 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Bizi bir arada tutan</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Öğrenme topluluğunun değerleri</h2>
            <p className="mt-2 text-sm leading-6 text-navy-500">Her özellikte ve her paylaşımda aynı hedef: öğrencilerin birbirine destek olmasını kolaylaştırmak.</p>
          </div>
          <ScrollReveal className="grid gap-4 md:grid-cols-3" stagger>
            {values.map((value, index) => (
              <article key={value.title} className="about-value-card rounded-2xl border border-navy-100 bg-white p-5 shadow-[0_8px_25px_rgba(16,42,67,0.04)] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><value.icon className="h-5 w-5" /></span>
                  <span className="text-xs font-bold tracking-[0.14em] text-navy-300">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-navy-500">{value.description}</p>
              </article>
            ))}
          </ScrollReveal>
        </section>

        <ScrollReveal>
          <section className="about-cta relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-9">
            <div aria-hidden="true" className="about-cta-glow absolute inset-0 -z-10" />
            <div aria-hidden="true" className="about-page-orbit absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full border border-white/10" />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-200"><Sparkles className="h-4 w-4" /> Topluluğa katıl</span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Birlikte daha çok öğrenebiliriz.</h2>
                <p className="mt-2 text-sm leading-6 text-navy-200">Aradığın kaynağı bul ya da kendi notunla başka bir öğrenciye destek ol.</p>
              </div>
              <Link href="/kayit" className="btn btn-teal btn-lg shrink-0">
                Hemen başla <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
