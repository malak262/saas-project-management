import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { get, post } from "../../shared/services/api";
import { useSession } from "../../shared/store/session";
import { Logo, Icon, Button, Field, Alert } from "../../shared/components/ui";
import { useResource } from "../../shared/hooks/useResource";

export function AuthPage({ register = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useSession();
  const { data: providers } = useResource(() => get("/api/auth/providers"));
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [fields, setFields] = useState({}),
    [show, setShow] = useState(false);
  if (session.token) return <Navigate to="/" replace />;
  const change = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const data = await post(
        `/api/auth/${register ? "register" : "login"}`,
        form,
      );
      session.signIn(data);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message);
      setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link to="/login">
          <Logo />
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow light">GOOD WORK HAPPENS TOGETHER</span>
          <h1>
            A little less busy.
            <br />A lot more <em>flow.</em>
          </h1>
          <p>
            Bring your people, projects, and ideas into one calm, connected
            workspace.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="mini-card mini-one">
              <span className="mini-icon">
                <Icon name="check" />
              </span>
              <div>
                <strong>Big ideas. Clear next steps.</strong>
                <span>One task at a time.</span>
              </div>
            </div>
            <div className="mini-card mini-two">
              <span className="mini-avatar">TF</span>
              <div>
                <strong>Your team, in sync</strong>
                <span>
                  <i /> All moving forward
                </span>
              </div>
            </div>
            <div className="mini-card mini-three">
              <span>Project momentum</span>
              <strong>
                Looking good <Icon name="spark" size={18} />
              </strong>
              <div className="mini-bars">
                {[30, 45, 36, 60, 52, 78, 90].map((h, i) => (
                  <i style={{ height: h }} key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer>Made for teams. Built for momentum.</footer>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Logo />
        </div>
        <div className="auth-form-wrap">
          <span className="auth-icon">
            <Icon name={register ? "team" : "sun"} size={26} />
          </span>
          <h2>{register ? "Make room for great work." : "Welcome back."}</h2>
          <p>
            {register
              ? "Create your Teamflow account. Your next chapter starts here."
              : "Your team is doing great things. Let’s get you back in."}
          </p>
          {(error || params.has("error")) && (
            <Alert>
              {error ||
                "We couldn’t complete that sign-in. Try again, and use the original sign-in method if you already have an account."}
            </Alert>
          )}
          <div className="social-buttons">
            {["google", "github"].map((p) => (
              <button
                key={p}
                className="btn btn-secondary"
                disabled={!providers?.[p] || busy}
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_API_BASE_URL || ""}/api/auth/oauth/authorize/${p}`;
                }}
                title={
                  providers?.[p]
                    ? `Continue with ${p}`
                    : "This provider has not been configured yet."
                }
              >
                <span className={`provider-icon ${p}`}>
                  {p === "google" ? (
                    "G"
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 .8A11.2 11.2 0 008.5 22.65c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.8-1.34-3.8-1.34-.5-1.3-1.25-1.65-1.25-1.65-1.03-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.73 2.63 1.23 3.27.94.1-.73.4-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.55 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15A10.7 10.7 0 0112 6.14c.95 0 1.9.13 2.79.38 2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.31-2.64 5.26-5.15 5.54.41.35.77 1.03.77 2.08v3.12c0 .3.2.65.78.54A11.2 11.2 0 0012 .8z" />
                    </svg>
                  )}
                </span>
                {p === "google" ? "Google" : "GitHub"}
              </button>
            ))}
          </div>
          <div className="divider">
            <span>or continue with email</span>
          </div>
          <form onSubmit={submit}>
            {register && (
              <Field label="Full name" error={fields.name}>
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={change}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
            )}
            <Field label="Email address" error={fields.email}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={change}
                required
                maxLength={254}
              />
            </Field>
            <Field
              label="Password"
              error={fields.password}
              hint={
                register
                  ? "At least 10 characters. Make it a strong one."
                  : null
              }
            >
              <span className="password-input">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register ? "Create a password" : "Enter your password"
                  }
                  value={form.password}
                  onChange={change}
                  required
                  minLength={register ? 10 : 1}
                  maxLength={72}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  <Icon name="eye" size={18} />
                </button>
              </span>
            </Field>
            <Button className="auth-submit" busy={busy} type="submit">
              {register ? "Create account" : "Sign in"}
              <Icon name="arrow" size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already part of a team?" : "New to Teamflow?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="auth-security">
            <Icon name="shield" size={15} /> A secure space for your team’s best
            work.
          </div>
        </div>
        <footer>Teamflow © {new Date().getFullYear()}</footer>
      </main>
    </div>
  );
}
export function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const signIn = useSession((s) => s.signIn);
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get("code");
    window.history.replaceState({}, "", "/auth/callback");
    if (!code) {
      setError("The sign-in code is missing. Please try again.");
      return;
    }
    post("/api/auth/exchange", { code })
      .then((data) => {
        signIn(data);
        navigate("/", { replace: true });
      })
      .catch((e) => setError(e.message));
  }, [navigate, params, signIn]);
  return (
    <main className="callback-page">
      <Logo />
      {error ? (
        <>
          <Alert>{error}</Alert>
          <Link className="btn btn-primary" to="/login">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <span className="spinner" />
          <p>Getting your workspace ready…</p>
        </>
      )}
    </main>
  );
}
