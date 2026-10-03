import { Link } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import AuthDivider from "../components/AuthDivider";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";
import GoogleButton from "../components/GoogleButton";
import { MailIcon } from "../components/Icons";
import PasswordField from "../components/PasswordField";

export default function SignInPage() {
    return (
        <AuthLayout>
            <AuthBrand />
            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <AuthField id="sign-in-email" label="Email" icon={<MailIcon />} type="email" placeholder="you@company.com" autoComplete="email" required />
                <PasswordField id="sign-in-password" label="Password" placeholder="Enter your password" autoComplete="current-password" />
                <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>
                <button className="auth-primary" type="submit">Sign in</button>
                <AuthDivider />
                <GoogleButton />
            </form>
            <p className="auth-footer">Don&apos;t have an account? <Link to="/sign-up">Create an account</Link></p>
        </AuthLayout>
    );
}
