import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { prisma } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const FALLBACK_NAME = "NewMobility";

// Task ID 6: metadata dinâmica — lê `platform_name` (ou fallback `app_name`)
// diretamente do banco (server-side) para que o <title>, description e
// keywords reflitam o nome configurado pelo admin em
// `Configurações do Sistema → Nome da Plataforma`.
async function getPlatformName(): Promise<string> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: ["platform_name", "app_name"] } },
      select: { key: true, value: true },
    });
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;
    return (
      (map.platform_name && map.platform_name.trim()) ||
      (map.app_name && map.app_name.trim()) ||
      FALLBACK_NAME
    );
  } catch {
    // Se o banco estiver indisponível, mantém o nome padrão.
    return FALLBACK_NAME;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const name = await getPlatformName();
  return {
    title: `${name} - BackOffice | Sistema de CashBack Multinível`,
    description: `${name} BackOffice - Plataforma de CashBack Multinível com Mobilidade Urbana, Refeição, Farmácia, Shopping e muito mais.`,
    keywords: [name, "CashBack", "MMN", "Multinível", "Mobilidade Urbana", "MLM"],
    icons: {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23059669'/><text x='50' y='68' font-size='50' font-weight='bold' text-anchor='middle' fill='white'>NM</text></svg>",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script to apply dark mode class before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = JSON.parse(localStorage.getItem('newmobility-auth'));
                  if (stored && stored.state && stored.state.darkMode) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
