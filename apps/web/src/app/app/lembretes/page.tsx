import { RemindersPanel } from "@/components/reminders-panel";
import { SiteChrome } from "@/components/site-chrome";

export default function LembretesPage() {
  return (
    <SiteChrome maxWidth={720}>
      <RemindersPanel />
    </SiteChrome>
  );
}
