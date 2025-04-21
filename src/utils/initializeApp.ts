
import { createSuperuser } from "@/integrations/supabase/createSuperuser";

export async function initializeApp() {
  // Only run in development for now
  if (import.meta.env.DEV) {
    try {
      await createSuperuser();
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }
}
