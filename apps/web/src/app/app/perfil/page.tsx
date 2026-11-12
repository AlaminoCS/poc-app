import { ProfileForm } from "@/components/profile-form";
import { SiteChrome } from "@/components/site-chrome";

export default function ProfilePage() {
  return (
    <SiteChrome maxWidth={640}>
      <ProfileForm />
    </SiteChrome>
  );
}
