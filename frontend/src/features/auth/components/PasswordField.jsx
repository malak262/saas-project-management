import { useState } from "react";
import AuthField from "./AuthField";
import { EyeIcon, LockIcon } from "./Icons";

export default function PasswordField({ id, label, placeholder, autoComplete }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <AuthField
            id={id}
            label={label}
            icon={<LockIcon />}
            type={isVisible ? "text" : "password"}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required
            trailing={
                <button
                    className="password-toggle"
                    type="button"
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    onClick={() => setIsVisible((current) => !current)}
                >
                    <EyeIcon hidden={!isVisible} />
                </button>
            }
        />
    );
}
