import Link from "next/link";
import "./globals.css";

const navigation = [
  { name: "蜂窝柱状图", href: "/" },
  { name: "消防车扑火", href: "/fire-truck" },
  { name: "属性查询分析", href: "/attribute-query" },
  { name: "栅格数据处理", href: "/grid" },
];

export default function RootLayout({ children }) {
  return (
    <html>
      <head />
      <body className="min-h-screen bg-slate-950">
        <div className="w-full px-4 pt-3">
          <nav>
            <div className="flex gap-0 md:gap-4 rounded-xl bg-slate-900/20">
              {navigation.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="w-full rounded-lg py-2.5 text-sm font-medium text-white text-center transition-colors hover:bg-white/10 focus:outline-none focus:bg-white/10"
                >
                  {name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <main className="mt-3">{children}</main>
      </body>
    </html>
  );
}
