import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  console.log("Check expiring subscriptions function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days from now
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const targetDate = threeDaysFromNow.toISOString().split("T")[0];

    console.log("Checking for subscriptions expiring on:", targetDate);

    // Find subscriptions expiring in exactly 3 days
    const { data: expiringSubscriptions, error: subError } = await supabase
      .from("suscripciones")
      .select(`
        id,
        store_id,
        fecha_vencimiento,
        estado,
        puntos_venta:store_id (
          id,
          nombre,
          email
        )
      `)
      .eq("fecha_vencimiento", targetDate)
      .eq("estado", "activo");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log("Found expiring subscriptions:", expiringSubscriptions?.length || 0);

    const emailResults = [];

    // Send reminder emails
    for (const subscription of expiringSubscriptions || []) {
      const store = subscription.puntos_venta as any;
      
      if (!store?.email) {
        console.log(`Store ${store?.nombre || subscription.store_id} has no email, skipping`);
        continue;
      }

      console.log(`Sending reminder to ${store.nombre} (${store.email})`);

      // Call the send-subscription-email function
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "send-subscription-email",
        {
          body: {
            type: "expiration_reminder",
            store_id: subscription.store_id,
            store_name: store.nombre,
            store_email: store.email,
            expiration_date: subscription.fecha_vencimiento,
          },
        }
      );

      if (emailError) {
        console.error(`Error sending email to ${store.email}:`, emailError);
        emailResults.push({ store: store.nombre, success: false, error: emailError.message });
      } else {
        console.log(`Email sent successfully to ${store.email}`);
        emailResults.push({ store: store.nombre, success: true });
      }
    }

    // Also check puntos_venta for stores without suscripciones entry
    const { data: storesWithExpiration, error: storesError } = await supabase
      .from("puntos_venta")
      .select("id, nombre, email, fecha_vencimiento")
      .eq("fecha_vencimiento", targetDate);

    if (storesError) {
      console.error("Error fetching stores:", storesError);
    } else {
      // Filter out stores that already have subscriptions
      const existingStoreIds = new Set((expiringSubscriptions || []).map(s => s.store_id));
      
      for (const store of storesWithExpiration || []) {
        if (existingStoreIds.has(store.id)) continue;
        if (!store.email) {
          console.log(`Store ${store.nombre} has no email, skipping`);
          continue;
        }

        console.log(`Sending reminder to ${store.nombre} (${store.email}) from puntos_venta`);

        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "send-subscription-email",
          {
            body: {
              type: "expiration_reminder",
              store_id: store.id,
              store_name: store.nombre,
              store_email: store.email,
              expiration_date: store.fecha_vencimiento,
            },
          }
        );

        if (emailError) {
          console.error(`Error sending email to ${store.email}:`, emailError);
          emailResults.push({ store: store.nombre, success: false, error: emailError.message });
        } else {
          console.log(`Email sent successfully to ${store.email}`);
          emailResults.push({ store: store.nombre, success: true });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${emailResults.length} expiring subscriptions`,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-subscriptions:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
