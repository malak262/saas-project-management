import { Link } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import AuthDivider from "../components/AuthDivider";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <AuthBrand />
            <div className="auth-heading">
                <h1>Reset password</h1>
                <p>Create a new password for your account.</p>
            </div>
            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                <PasswordField id="reset-password" label="New password" placeholder="Create a new password" autoComplete="new-password" />
                <PasswordField id="reset-password-confirm" label="Confirm new password" placeholder="Confirm your new password" autoComplete="new-password" />
                <button className="auth-primary" type="submit">Update password</button>
            </form>
            <AuthDivider />
            <p className="auth-footer"><Link to="/sign-in">Back to sign in</Link></p>
        </AuthLayout>
    );
}
