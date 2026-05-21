import { getSession } from "@/src/lib/session";
import LayoutHeader from "./components/LayoutHeader";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        template: '%s | Intro to ML - CSW',
        default: 'Intro to ML - CSW',
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getSession();

    const user = session?.userId ? {
        name: session.name || "User",
        role: session.role || "student"
    } : null;
    const isStaff = session?.role === "instructor" || session?.role === "teacher";

    return (
        <html lang="en" className="h-full">
            <body className={`min-h-full flex flex-col ${isStaff ? "instructor-view" : ""}`}>
                {session.isLoggedIn && (
                    <LayoutHeader
                        user={{ name: user?.name || "User", role: user?.role || "student" }}
                        isStaff={!!isStaff}
                    />
                )}

                <div id="main-layout" className="flex flex-1 mx-auto w-full max-w-[1100px] items-start">
                    {session.isLoggedIn && <Sidebar />}
                    <main id="content" className="flex-1 p-[18px_22px]">
                        {children}
                    </main>
                </div>

                {session.isLoggedIn && <Footer />}
            </body>
        </html>
    );
}
