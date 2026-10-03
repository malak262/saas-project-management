export default function AuthField({ label, icon, trailing, id, ...inputProps }) {
    return (
        <div className="auth-field">
            <label htmlFor={id}>{label}</label>
            <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">{icon}</span>
                <input id={id} {...inputProps} />
                {trailing}
            </div>
        </div>
    );
}
