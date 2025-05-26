
import { supabase } from "./client";

// This is a development utility function to create the initial superuser
export const createSuperuser = async (email = "itest6904@gmail.com", password = "Kenya123!") => {
  try {
    // Check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "super admin");
    
    if (checkError) {
      throw new Error(`Error checking superuser: ${checkError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log("Super admin already exists");
      return;
    }
    
    console.log("Creating super admin with email:", email);
    
    // Create the superuser
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: "Super Admin",
          role: "super admin"
        },
      }
    });
    
    if (error) {
      throw new Error(`Error creating super admin: ${error.message}`);
    }
    
    console.log("Super admin created:", data);
    
    // Directly update the user role in the profiles table to ensure it's set
    if (data.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "super admin" })
        .eq("id", data.user.id);
      
      if (updateError) {
        throw new Error(`Error updating super admin role: ${updateError.message}`);
      }
      
      console.log("Super admin role updated in profiles table");
    }
    
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
