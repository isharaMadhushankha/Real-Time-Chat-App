import { createClient } from "@supabase/supabase-js";

// Load Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a chat image file to the Supabase Storage bucket 'chat-images'.
 * If Supabase environment variables are placeholders or if upload fails,
 * it falls back gracefully to a Base64-encoded URL to keep the app working locally.
 * 
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The public URL or Base64 string of the image.
 */
export const uploadChatImage = async (file) => {
  try {
    // Check if configuration is set
    const isMock = supabaseUrl.includes("your-supabase-project") || supabaseAnonKey === "your-anon-key";
    
    if (isMock) {
      console.warn("Supabase credentials not configured in .env. Converting to Base64 fallback.");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chats/${fileName}`;

    // Upload file to the 'chat-images' bucket
    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Retrieve public URL of the uploaded asset
    const { data: publicUrlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Supabase Storage upload failed, utilizing Base64 fallback:", error);
    
    // Elegant fallback to Base64 data URI to preserve premium UX in offline/mock conditions
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
};
