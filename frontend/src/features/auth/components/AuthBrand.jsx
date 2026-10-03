export default function AuthBrand() {
    return (
        <div className="auth-brand">
            <span className="auth-brand__mark" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                    <path d="m24 9 14 10-14 10L10 19 24 9Z" fill="currentColor" />
                    <path d="m13.5 27 10.5 7.5L34.5 27" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            <span>
                <strong>Taskori</strong>
                <small>Projects move forward.</small>
            </span>
        </div>
    );
}
