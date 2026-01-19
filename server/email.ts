import { Resend } from "resend";
import { storage } from "./storage";

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

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

export async function sendSubscriptionEmail(payload: EmailRequest) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY no está configurado");
  }

  const resend = new Resend(resendApiKey);

  if (payload.type === "test") {
    return resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [payload.test_email || ""],
      subject: "Prueba de configuración - Caiman POS Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Configuración Exitosa!</h1>
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
    return resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [payload.store_email || ""],
      subject: "Aviso de vencimiento - Caiman POS Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h1 style="color: #d97706; margin: 0;">Aviso de Vencimiento</h1>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">Hola <strong>${payload.store_name}</strong>,</p>
          
          <p style="font-size: 16px;">Te recordamos que tu suscripción a <strong>Caiman POS Connect</strong> vence en <strong>3 días</strong>.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">
              <strong>Fecha de vencimiento:</strong> ${formatDate(payload.expiration_date || "")}
            </p>
          </div>
          
          <p style="font-size: 16px;">Para evitar la suspensión del servicio, por favor realiza tu pago y envía el comprobante a nuestro equipo de soporte.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://wa.me/5219612345678?text=Hola,%20quiero%20renovar%20mi%20suscripci%C3%B3n%20de%20${encodeURIComponent(payload.store_name || "")}" 
               style="background: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Contactar por WhatsApp
            </a>
          </div>
          
          ${emailSignature}
        </div>
      `,
    });
  } else if (payload.type === "payment_confirmation") {
    const attachments = payload.pdf_base64 ? [{
      filename: `recibo-${new Date().toISOString().split("T")[0]}.pdf`,
      content: payload.pdf_base64,
    }] : undefined;

    return resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [payload.store_email || ""],
      subject: "Pago Recibido! - Caiman POS Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h1 style="color: #059669; margin: 0;">Pago Recibido!</h1>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">Hola <strong>${payload.store_name}</strong>,</p>
          
          <p style="font-size: 16px;">Hemos recibido tu pago correctamente. Tu suscripción ha sido renovada.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">
              <strong>Monto pagado:</strong> $${(payload.payment_amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p style="margin: 10px 0 0; font-size: 18px;">
              <strong>Nueva fecha de vencimiento:</strong> ${formatDate(payload.new_expiration_date || "")}
            </p>
          </div>
          
          <p style="font-size: 16px;">
            ${payload.pdf_base64 ? "Adjunto encontrarás tu recibo en formato PDF." : "Tu recibo ha sido generado exitosamente."}
          </p>
          
          <p style="font-size: 16px;">Gracias por tu confianza en Caiman POS Connect!</p>
          
          ${emailSignature}
        </div>
      `,
      attachments,
    });
  }
}

export async function checkExpiringSubscriptions() {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  const targetDate = threeDaysFromNow.toISOString().split("T")[0];

  console.log("Checking for subscriptions expiring on:", targetDate);

  const expiringStores = await storage.getExpiringSubscriptions(targetDate);
  const results = [];

  for (const store of expiringStores) {
    if (!store.email) {
      console.log(`Store ${store.nombre} has no email, skipping`);
      continue;
    }

    console.log(`Sending reminder to ${store.nombre} (${store.email})`);

    try {
      await sendSubscriptionEmail({
        type: "expiration_reminder",
        store_id: store.id,
        store_name: store.nombre,
        store_email: store.email,
        expiration_date: store.fechaVencimiento || "",
      });
      results.push({ store: store.nombre, success: true });
    } catch (error: any) {
      console.error(`Error sending email to ${store.email}:`, error);
      results.push({ store: store.nombre, success: false, error: error.message });
    }
  }

  return results;
}
