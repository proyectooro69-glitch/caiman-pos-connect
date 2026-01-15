-- Habilitar las extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear el cron job que revisa suscripciones próximas a vencer cada día a las 9:00 AM
SELECT cron.schedule(
  'check-expiring-subscriptions-daily',
  '0 9 * * *', -- Todos los días a las 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://mkofteflphrmdkmzcpxw.supabase.co/functions/v1/check-expiring-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Para ver los trabajos programados:
-- SELECT * FROM cron.job;

-- Para desactivar el cron job:
-- SELECT cron.unschedule('check-expiring-subscriptions-daily');
