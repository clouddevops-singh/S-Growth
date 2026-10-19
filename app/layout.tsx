import type { Metadata } from "next";
import "./styles.css";
import "./chart.css";
import "./profile.css";

export const metadata: Metadata = {
  title: "S-Growth — Personal Growth Dashboard",
  description: "A private dashboard for habits, goals, and steady personal growth.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
