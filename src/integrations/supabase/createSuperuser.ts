
import { supabase } from "./client";

// This is a development utility function to create the initial superuser
export const createSuperuser = async (email = "itest6904@gmail.com", password = "Kenya123!") => {
  try {
    // First, check if the user exists in auth.users by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInData?.user) {
      console.log("User already exists, checking/updating role...");
      
      // User exists, now check/update their role in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", signInData.user.id)
        .single();

      if (profileError) {
        console.log("Profile not found, creating one...");
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: signInData.user.id,
            name: "Super Admin",
            role: "super admin"
          });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Super admin profile created successfully");
        }
      } else if (profile.role !== "super admin") {
        // Update role if it's not already super admin
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: "super admin" })
          .eq("id", signInData.user.id);

        if (updateError) {
          console.error("Error updating role:", updateError);
        } else {
          console.log("User role updated to super admin");
        }
      } else {
        console.log("User already has super admin role");
      }

      // Sign out after checking/updating
      await supabase.auth.signOut();
      return signInData;
    }

    // If sign in failed, try to create the user
    if (signInError && signInError.message !== "Invalid login credentials") {
      throw signInError;
    }

    // Check if any super admin exists in profiles table
    const { data: existingAdmins, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "super admin");
    
    if (checkError) {
      throw new Error(`Error checking for existing super admin: ${checkError.message}`);
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log("Super admin already exists in profiles table");
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
