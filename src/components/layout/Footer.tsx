
import { useAppSettings } from "../settings/GlobalSettingsProvider";

export function Footer() {
  const { settings } = useAppSettings();
  
  if (!settings?.footer_text) {
    return null;
  }
  
  return (
    <footer className="border-t mt-auto py-4 px-4 text-center text-sm text-muted-foreground">
      {settings.footer_text}
    </footer>
  );
}
