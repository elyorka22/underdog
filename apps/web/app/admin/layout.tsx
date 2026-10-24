import "../admin/admin.css";

export const metadata = {
  title: "UnderDog Admin — Boshqaruv",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
