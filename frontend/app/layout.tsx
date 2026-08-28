import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Pathfinding Dashboard | Dijkstra vs A*",
  description: "Visualizer & Benchmark Dashboard for Dijkstra and A* pathfinding algorithms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-screen antialiased bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
