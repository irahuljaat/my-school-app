import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from './components/MainLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'MVG School Jaipur | Best RBSE English Medium Sr. Sec. School & Robotics Lab',
  description: 'MVG School is a premier RBSE English Medium Senior Secondary school in Jaipur specializing in Robotics, Visual Arts, and Academic Excellence. Enroll for 2026-27.',
  keywords: ['RBSE School Jaipur', 'Best School in Jaipur', 'Robotics Education Jaipur', 'English Medium School Jaipur', 'MVG School'],
  openGraph: {
    title: 'MVG School Jaipur | Future-Ready Education',
    description: 'Leading RBSE school in Jaipur with advanced Robotics curriculum.',
    images: ['/og-image.jpg'], 
    type: 'website',
  },
  alternates: {
    canonical: 'https://mvgschool.com',
  }
};

export default function RootLayout({ children }) {
  // Structured Data for Google Search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    "name": "MVG School Jaipur",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Jaipur",
      "addressRegion": "Rajasthan",
      "addressCountry": "IN"
    },
    "description": "Premier RBSE English Medium Senior Secondary School in Jaipur featuring a dedicated Robotics Lab and Visual Arts curriculum.",
    "url": "https://mvgschool.com",
    "educationalLevel": "Senior Secondary",
    "offers": {
      "@type": "Offer",
      "category": "Admission 2026-27"
    }
  };

  return (
    <html lang="en">
      <head>
        {/* Injecting Local SEO Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}