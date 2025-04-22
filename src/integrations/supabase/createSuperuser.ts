
import { supabase } from "./client";

// This is a development utility function to create the initial superuser
export const createSuperuser = async () => {
  const email = "itest6904@gmail.com";
  const password = "Kenya123!";
  
  try {
    // Check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "superuser");
    
    if (checkError) {
      throw new Error(`Error checking superuser: ${checkError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log("Superuser already exists");
      return;
    }
    
    // Create the superuser
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: "Super Admin",
          role: "superuser"
        },
      }
    });
    
    if (error) {
      throw new Error(`Error creating superuser: ${error.message}`);
    }
    
    console.log("Superuser created:", data);
    
    // Directly update the user role in the profiles table to ensure it's set
    if (data.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "superuser" })
        .eq("id", data.user.id);
      
      if (updateError) {
        throw new Error(`Error updating superuser role: ${updateError.message}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
