
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailConfig {
  provider: string;
  fromName: string;
  fromEmail: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  resendApiKey?: string;
}

async function sendTestSmtpEmail(config: EmailConfig): Promise<void> {
  const client = new SmtpClient();
  
  await client.connect({
    hostname: config.smtpHost as string,
    port: parseInt(config.smtpPort as string),
    username: config.smtpUsername as string,
    password: config.smtpPassword as string,
  });
  
  await client.send({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: config.fromEmail,
    subject: "Test Email from David's Hope International",
    content: "This is a test email to verify your SMTP configuration.",
    html: `
      <h1>Email Configuration Test</h1>
      <p>Hello,</p>
      <p>This is a test email sent to verify your SMTP configuration.</p>
      <p>If you're receiving this email, your email settings are correctly configured!</p>
      <p>Best regards,<br/>David's Hope International</p>
    `,
  });
  
  await client.close();
}

async function sendTestResendEmail(config: EmailConfig): Promise<void> {
  const resend = new Resend(config.resendApiKey);
  
  await resend.emails.send({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: config.fromEmail,
    subject: "Test Email from David's Hope International",
    html: `
      <h1>Email Configuration Test</h1>
      <p>Hello,</p>
      <p>This is a test email sent to verify your Resend API configuration.</p>
      <p>If you're receiving this email, your email settings are correctly configured!</p>
      <p>Best regards,<br/>David's Hope International</p>
    `,
  });
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { provider, fromName, fromEmail, smtpHost, smtpPort, smtpUsername, smtpPassword, resendApiKey } = await req.json() as EmailConfig;
    
    if (!provider) {
      throw new Error("Email provider is required");
    }
    
    if (!fromName || !fromEmail) {
      throw new Error("From name and email are required");
    }
    
    if (provider === 'smtp') {
      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
        throw new Error("SMTP configuration is incomplete");
      }
      
      await sendTestSmtpEmail({
        provider,
        fromName,
        fromEmail,
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword,
      });
    } else if (provider === 'resend') {
      if (!resendApiKey) {
        throw new Error("Resend API key is required");
      }
      
      await sendTestResendEmail({
        provider,
        fromName,
        fromEmail,
        resendApiKey,
      });
    } else {
      throw new Error("Invalid email provider");
    }

    return new Response(JSON.stringify({ success: true, message: "Test email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
