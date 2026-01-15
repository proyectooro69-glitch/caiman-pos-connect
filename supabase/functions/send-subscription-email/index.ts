import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SENDER_EMAIL = "info@caimanpos.com";
const SENDER_NAME = "Caiman POS Connect";

const emailSignature = `
<br><br>
<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
<p style="color: #666; font-size: 12px;">
  <strong>Caiman POS Connect - Soporte Técnico</strong><br>
  Este es un mensaje automático, por favor no responda a esta dirección.
</p>
`;

interface EmailRequest {
  type: "expiration_reminder" | "payment_confirmation" | "test";
  store_id?: string;
  store_name?: string;
  store_email?: string;
  expiration_date?: string;
  new_expiration_date?: string;
  payment_amount?: number;
  pdf_base64?: string;
  test_email?: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

serve(async (req: Request): Promise<Response> => {
  console.log("Email function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailRequest = await req.json();
    console.log("Email request payload:", JSON.stringify(payload, null, 2));

    let emailResult;

    if (payload.type === "test") {
      // Test email
      console.log("Sending test email to:", payload.test_email);
      emailResult = await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [payload.test_email || ""],
        subject: "✅ Prueba de configuración - Caiman POS Connect",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">¡Configuración Exitosa!</h1>
            <p>Este es un correo de prueba para verificar que la configuración de emails está funcionando correctamente.</p>
            <p>Si estás recibiendo este mensaje, significa que el sistema de notificaciones por correo está listo para usarse.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Fecha de prueba:</strong> ${formatDate(new Date().toISOString())}</p>
              <p style="margin: 10px 0 0;"><strong>Remitente:</strong> ${SENDER_EMAIL}</p>
            </div>
            ${emailSignature}
          </div>
        `,
      });
    } else if (payload.type === "expiration_reminder") {
      // Expiration reminder email
      console.log("Sending expiration reminder to:", payload.store_email);
      emailResult = await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [payload.store_email || ""],
        subject: "⚠️ Aviso de vencimiento - Caiman POS Connect",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h1 style="color: #d97706; margin: 0;">⚠️ Aviso de Vencimiento</h1>
            </div>
            
            <p style="font-size: 16px; margin-top: 20px;">Hola <strong>${payload.store_name}</strong>,</p>
            
            <p style="font-size: 16px;">Te recordamos que tu suscripción a <strong>Caiman POS Connect</strong> vence en <strong>3 días</strong>.</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">
                <strong>📅 Fecha de vencimiento:</strong> ${formatDate(payload.expiration_date || "")}
              </p>
            </div>
            
            <p style="font-size: 16px;">Para evitar la suspensión del servicio, por favor realiza tu pago y envía el comprobante a nuestro equipo de soporte.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://wa.me/5219612345678?text=Hola,%20quiero%20renovar%20mi%20suscripci%C3%B3n%20de%20${encodeURIComponent(payload.store_name || "")}" 
                 style="background: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                📱 Contactar por WhatsApp
              </a>
            </div>
            
            ${emailSignature}
          </div>
        `,
      });
    } else if (payload.type === "payment_confirmation") {
      // Payment confirmation email
      console.log("Sending payment confirmation to:", payload.store_email);
      
      const attachments = payload.pdf_base64 ? [{
        filename: `recibo-${new Date().toISOString().split("T")[0]}.pdf`,
        content: payload.pdf_base64,
      }] : undefined;

      emailResult = await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [payload.store_email || ""],
        subject: "✅ ¡Pago Recibido! - Caiman POS Connect",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
              <h1 style="color: #059669; margin: 0;">✅ ¡Pago Recibido!</h1>
            </div>
            
            <p style="font-size: 16px; margin-top: 20px;">Hola <strong>${payload.store_name}</strong>,</p>
            
            <p style="font-size: 16px;">Hemos recibido tu pago correctamente. Tu suscripción ha sido renovada.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">
                <strong>💰 Monto pagado:</strong> $${(payload.payment_amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
              <p style="margin: 10px 0 0; font-size: 18px;">
                <strong>📅 Nueva fecha de vencimiento:</strong> ${formatDate(payload.new_expiration_date || "")}
              </p>
            </div>
            
            <p style="font-size: 16px;">
              ${payload.pdf_base64 ? "Adjunto encontrarás tu recibo en formato PDF." : "Tu recibo ha sido generado exitosamente."}
            </p>
            
            <p style="font-size: 16px;">¡Gracias por tu confianza en Caiman POS Connect!</p>
            
            ${emailSignature}
          </div>
        `,
        attachments,
      });
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
