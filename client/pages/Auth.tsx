import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import caimanLogo from "@/assets/caiman-logo.png";

type AuthMode = "login" | "register";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    businessName: "",
  });

  /* ==========================
     Redirección si ya hay sesión
     ========================== */
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  /* ==========================
     Handlers
     ========================== */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          let message = "Error al iniciar sesión";

          if (error.message.includes("Invalid login credentials")) {
            message = "Credenciales incorrectas";
          } else if (error.message.includes("Email not confirmed")) {
            message = "Debes confirmar tu correo electrónico";
          }

          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });

        navigate("/dashboard");
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          nombre: formData.name,
          negocio: formData.businessName,
        });

        if (error) {
          let message = "Error al crear la cuenta";

          if (error.message.includes("already registered")) {
            message = "Este correo ya está registrado";
          } else if (error.message.toLowerCase().includes("password")) {
            message = "La contraseña debe tener al menos 6 caracteres";
          }

          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cuenta creada 🎉",
          description: "Revisa tu correo para confirmar tu cuenta",
        });

        setMode("login");
      }
    } catch {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================
     UI
     ========================== */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-glow opacity-30" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden shadow-glow animate-pulse-glow">
              <img
                src={caimanLogo}
                alt="Caiman POS"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-2xl font-bold mb-1">
              Caiman<span className="text-gradient">-POS</span>
            </h1>

            <p className="text-muted-foreground text-sm">
              {mode === "login"
                ? "Inicia sesión en tu cuenta"
                : "Crea tu cuenta para empezar"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-secondary/50 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === "register"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="Juan Pérez"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del negocio</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Mi Tienda"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
              className="text-primary font-medium hover:text-primary/80"
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Caiman-POS. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Auth;
