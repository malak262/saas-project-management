export function MailIcon() {
    return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function LockIcon() {
    return <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export function UserIcon() {
    return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 21c.7-4 3.2-6 8-6s7.3 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export function EyeIcon({ hidden }) {
    return hidden
        ? <svg viewBox="0 0 24 24" fill="none"><path d="M3 3 21 21M10.7 6.2A10.8 10.8 0 0 1 12 6c5.5 0 8.8 6 8.8 6a15 15 0 0 1-3 3.8M6.1 6.1C4 7.8 3.2 10 3.2 12c0 0 3.3 6 8.8 6 1.4 0 2.6-.4 3.7-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        : <svg viewBox="0 0 24 24" fill="none"><path d="M3.2 12S6.5 6 12 6s8.8 6 8.8 6-3.3 6-8.8 6-8.8-6-8.8-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

export function ArrowIcon() {
    return <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
