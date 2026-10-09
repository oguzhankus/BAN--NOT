import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from 'lucide-react';

interface PolicySection {
  id: string;
  title: string;
  content: ReactNode;
}

interface PolicyPageLayoutProps {
  title: string;
  description: string;
  sections: PolicySection[];
  updatedAt?: string;
}

export default function PolicyPageLayout({
  title,
  description,
  sections,
  updatedAt,
}: PolicyPageLayoutProps) {
  return (
    <div className="legal-page-shell min-h-screen pb-16">
      <div className="container-app max-w-5xl py-8 sm:py-12">
        <Link href="/" className="legal-back-link mb-6 inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Ana sayfaya dön
        </Link>

        <header className="legal-page-hero relative isolate overflow-hidden rounded-[1.75rem] p-6 text-white shadow-[0_24px_60px_rgba(16,42,67,0.16)] sm:p-10 lg:p-12">
          <div aria-hidden="true" className="legal-page-orbit absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="legal-page-glow absolute inset-0 -z-20" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Şeffaflık ve güven
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-navy-200 sm:text-base sm:leading-8">{description}</p>
            {updatedAt && (
              <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-white/65">
                <FileText className="h-3.5 w-3.5" /> Son güncellenme: {updatedAt}
              </p>
            )}
          </div>
        </header>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <nav className="legal-section-nav rounded-2xl border border-navy-100 bg-white p-3 shadow-[0_8px_24px_rgba(16,42,67,0.04)] lg:sticky lg:top-24" aria-label={`${title} bölümleri`}>
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy-400">Bu sayfada</p>
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="legal-section-link group flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-navy-600 transition-colors hover:bg-teal-50 hover:text-teal-800 lg:w-full"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-navy-50 text-[10px] font-bold text-navy-500 group-hover:bg-white group-hover:text-teal-700">{String(index + 1).padStart(2, '0')}</span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{section.title}</span>
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="legal-content-card scroll-mt-28 rounded-2xl border border-navy-100 bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.035)] sm:p-7">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-extrabold text-teal-800">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="pt-1 text-base font-bold leading-snug text-navy-900 sm:text-lg">{section.title}</h2>
                </div>
                <div className="legal-prose pl-0 sm:pl-12">{section.content}</div>
              </section>
            ))}

            <div className="legal-contact-card flex flex-col gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-bold text-navy-900">Bir sorunuz mu var?</p>
                <p className="mt-1 text-xs leading-5 text-navy-600">Bu sayfayla ilgili destek için bize yazabilirsiniz.</p>
              </div>
              <a href="mailto:iletisim@banunot.com" className="btn btn-secondary btn-sm shrink-0">
                İletişime geç <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
