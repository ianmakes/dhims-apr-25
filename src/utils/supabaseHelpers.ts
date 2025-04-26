
import { supabase } from "@/integrations/supabase/client";

// The URL for the Supabase REST API is specified in the client file
export const SUPABASE_URL = "https://kktbmiyjtdakozmwygjz.supabase.co";

// Headers needed for authenticated REST API calls
export const getAuthHeaders = () => {
  return {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdGJtaXlqdGRha296bXd5Z2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzM0OTUsImV4cCI6MjA2MDgwOTQ5NX0.YpUaOvgBK8knsBHba8rS64iU_IuqSiojIOI2fPj_mPE',
    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdGJtaXlqdGRha296bXd5Z2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzM0OTUsImV4cCI6MjA2MDgwOTQ5NX0.YpUaOvgBK8knsBHba8rS64iU_IuqSiojIOI2fPj_mPE`,
    'Content-Type': 'application/json',
  };
};
