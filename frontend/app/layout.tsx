import { Toaster } from 'react-hot-toast';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Toaster position="top-center" />
    </html>
  );
}
