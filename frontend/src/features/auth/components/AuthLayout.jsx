import "../auth.css";

export default function AuthLayout({ children }) {
    return (
        <main className="auth-page">
            <section className="auth-card" aria-label="Authentication">
                {children}
            </section>
        </main>
    );
}
