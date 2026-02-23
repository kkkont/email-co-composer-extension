import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Co-Composer API",
  description: "Backend API for Email Co-Composer",
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
