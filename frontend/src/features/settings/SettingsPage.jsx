import { useState } from "react";
import { get, put } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import { useSession } from "../../shared/store/session";
import {
  Icon,
  Avatar,
  Button,
  Field,
  Alert,
  Loading,
  ErrorState,
  Badge,
  useToast,
} from "../../shared/components/ui";
export default function SettingsPage() {
  const resource = useResource(() => get("/api/users/me"));
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Your settings</h1>
          <p>A few details that help your team get to know you.</p>
        </div>
      </div>
      <ProfileForm profile={resource.data} />
    </>
  );
}
function ProfileForm({ profile }) {
  const [form, setForm] = useState({
      name: profile.name,
      jobTitle: profile.jobTitle,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const updateUser = useSession((s) => s.updateUser),
    signOut = useSession((s) => s.signOut),
    toast = useToast();
  const change = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  return (
    <div className="settings-grid">
      <section className="panel settings-panel">
        <div className="section-heading">
          <div>
            <h2>Personal profile</h2>
            <p>The person behind the good work.</p>
          </div>
          <Badge tone="purple">{profile.role.toLowerCase()}</Badge>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const user = await put("/api/users/me", form);
              updateUser(user);
              toast("Your profile feels more like you.");
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="profile-preview">
            <Avatar user={{ ...profile, ...form }} size={72} />
            <div>
              <strong>{form.name || "Your name"}</strong>
              <span>{form.jobTitle || "Your next great role"}</span>
            </div>
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="form-grid">
            <Field label="Full name">
              <input
                name="name"
                value={form.name}
                onChange={change}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Job title">
              <input
                name="jobTitle"
                value={form.jobTitle}
                onChange={change}
                placeholder="e.g. Product designer"
                maxLength={100}
              />
            </Field>
          </div>
          <Field
            label="Email address"
            hint="Your email is connected to your sign-in identity."
          >
            <input value={profile.email} disabled type="email" />
          </Field>
          <Field
            label="Avatar image URL"
            hint="Use a public HTTPS image URL, or leave blank for your initials."
          >
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={change}
              type="url"
              placeholder="https://…"
              maxLength={2000}
            />
          </Field>
          <Field label="A little about you">
            <textarea
              name="bio"
              value={form.bio}
              onChange={change}
              rows={3}
              placeholder="What do you bring to the team?"
              maxLength={500}
            />
          </Field>
          <div className="settings-save">
            <Button type="submit" busy={busy}>
              Save changes
            </Button>
          </div>
        </form>
      </section>
      <aside className="panel account-panel">
        <span className="account-icon">
          <Icon name="shield" size={25} />
        </span>
        <h2>Your account, protected.</h2>
        <p>
          Teamflow uses a secure session that expires after one hour. Sign in
          again whenever you’re ready to pick things up.
        </p>
        <div className="account-detail">
          <Icon name="mail" size={17} />
          <span>{profile.email}</span>
        </div>
        <Button variant="secondary" icon="logout" onClick={signOut}>
          Sign out
        </Button>
      </aside>
    </div>
  );
}
