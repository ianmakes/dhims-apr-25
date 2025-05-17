
import { createSuperuser } from "@/integrations/supabase/createSuperuser";

// Default fallback values - only used if env vars are not set
const DEFAULT_SUPERADMIN_EMAIL = "itest6904@gmail.com";
const DEFAULT_SUPERADMIN_PASSWORD = "Kenya123!";

export async function initializeApp() {
  // Only run in development for now
  if (import.meta.env.DEV) {
    try {
      // Use environment variables with fallbacks to defaults
      const email = import.meta.env.VITE_SUPERADMIN_EMAIL || DEFAULT_SUPERADMIN_EMAIL;
      const password = import.meta.env.VITE_SUPERADMIN_PASSWORD || DEFAULT_SUPERADMIN_PASSWORD;
      
      await createSuperuser(email, password);
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }
}
