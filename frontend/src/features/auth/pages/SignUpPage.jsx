import { Link } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import AuthDivider from "../components/AuthDivider";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";
import GoogleButton from "../components/GoogleButton";
import { ArrowIcon, MailIcon, UserIcon } from "../components/Icons";
import PasswordField from "../components/PasswordField";

export default function SignUpPage() {
    return (
        <AuthLayout>
            <AuthBrand />
            <div className="auth-heading">
                <h1>Create your account</h1>
                <p>Get started with Taskori and bring your work together.</p>
            </div>
            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <AuthField id="sign-up-name" label="Full name" icon={<UserIcon />} type="text" placeholder="John Doe" autoComplete="name" required />
                <AuthField id="sign-up-email" label="Email" icon={<MailIcon />} type="email" placeholder="you@company.com" autoComplete="email" required />
                <PasswordField id="sign-up-password" label="Password" placeholder="Create a password" autoComplete="new-password" />
                <PasswordField id="sign-up-confirm-password" label="Confirm password" placeholder="Confirm your password" autoComplete="new-password" />
                <button className="auth-primary auth-primary--with-icon" type="submit">Create account <ArrowIcon /></button>
                <AuthDivider />
                <GoogleButton />
            </form>
            <p className="auth-footer">Already have an account? <Link to="/sign-in">Sign in</Link></p>
        </AuthLayout>
    );
}
