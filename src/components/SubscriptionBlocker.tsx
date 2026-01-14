import { AlertTriangle, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionBlockerProps {
  children: React.ReactNode;
}

export const SubscriptionBlocker = ({ children }: SubscriptionBlockerProps) => {
  const { isExpired, fechaVencimiento, loading, estado } = useSubscription();

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              Suscripción Vencida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Tu suscripción venció el{' '}
              <span className="font-semibold text-foreground">
                {fechaVencimiento 
                  ? format(parseISO(fechaVencimiento), "d 'de' MMMM, yyyy", { locale: es })
                  : 'fecha desconocida'
                }
              </span>
            </p>
            
            <p className="text-sm text-muted-foreground">
              Para continuar usando el sistema, por favor contacta al administrador para renovar tu suscripción.
            </p>

            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:+1234567890">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar al Soporte
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:soporte@caiman.com">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Correo
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              Una vez realizado el pago, tu acceso será restaurado automáticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
