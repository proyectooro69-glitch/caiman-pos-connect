import { AlertTriangle, Phone, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionBlockerProps {
  children: React.ReactNode;
}

export const SubscriptionBlocker = ({ children }: SubscriptionBlockerProps) => {
  const { isExpired, fechaVencimiento, loading } = useSubscription();

  const supportPhone = '5551234567'; // Número de soporte

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    const formattedDate = fechaVencimiento 
      ? format(parseISO(fechaVencimiento), "d 'de' MMMM, yyyy", { locale: es })
      : 'fecha desconocida';

    const whatsappMessage = encodeURIComponent(
      `Hola, mi suscripción a Caiman POS Connect ha vencido. Necesito ayuda para renovarla.`
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              Servicio Suspendido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <p className="text-muted-foreground mb-2">
                Tu suscripción a Caiman POS Connect ha expirado.
              </p>
              <div className="bg-card rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground">Fecha de vencimiento:</p>
                <p className="font-semibold text-foreground">{formattedDate}</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Para renovar tu servicio y continuar operando, contacta a nuestro equipo de soporte.
            </p>

            <div className="space-y-3">
              <Button 
                className="w-full gap-2" 
                onClick={() => window.open(`https://wa.me/52${supportPhone}?text=${whatsappMessage}`, '_blank')}
              >
                <MessageCircle className="h-5 w-5" />
                Contactar por WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => window.open(`tel:+52${supportPhone}`, '_blank')}
              >
                <Phone className="h-5 w-5" />
                Llamar a Soporte
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Horario de atención: Lunes a Viernes 9:00 - 18:00
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
