import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelGuide3D - 3D Google Maps Tour Application",
  description: "Photrealistic 3D map tour application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
