import { Link } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import AuthDivider from "../components/AuthDivider";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";
import { MailIcon } from "../components/Icons";

export default function ForgotPasswordPage() {
    return (
        <AuthLayout>
            <AuthBrand />
            <div className="auth-heading">
                <h1>Forgot your password?</h1>
                <p>Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </div>
            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <AuthField id="forgot-password-email" label="Email" icon={<MailIcon />} type="email" placeholder="you@company.com" autoComplete="email" required />
                <button className="auth-primary" type="submit">Send reset link</button>
            </form>
            <AuthDivider />
            <p className="auth-footer"><Link to="/sign-in">Back to sign in</Link></p>
        </AuthLayout>
    );
}
