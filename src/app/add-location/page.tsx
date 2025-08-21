import { CityForm } from "@/components/forms/CityForm";

export const metadata = {
  title: "Sign Up - Marti-Boutique",
  description:
    "Secure signup to your account. Access your fashion vendor shop now.",
  keywords: ["signup", "SaaS", "multi-tenant", "fashion vendor shop", "auth"],
  robots: "index, follow",
  openGraph: {
    title: "Sign Up - Marti-Boutique",
    description:
      "Secure signup to your fashion vendor shop from Marti-Boutique.",
    url: "https://hektic-pukkawit-projects.vercel.app/signup",
    siteName: "Marti-Boutique",
    locale: "en_US",
    type: "website",
  },
};

export default function CityFormPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <CityForm />
    </main>
  );
}
