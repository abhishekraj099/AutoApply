import "./globals.css";

export const metadata = {
  title: "AutoApply — Job Application Email Scheduler",
  description: "Automatically schedule and send job application emails to recruiters",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
