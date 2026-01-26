import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
          title: "Bienvenido!",
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
          title: "Cuenta creada",
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.1),transparent_70%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden shadow-lg shadow-green-500/20">
            <img
              src={caimanLogo}
              alt="Caiman POS"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold text-white">
            Caiman<span className="text-green-500">-POS</span>
          </h1>
        </div>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardContent className="p-6">
            <p className="text-center text-gray-400 text-sm mb-6">
              {mode === "login"
                ? "Inicia sesión en tu cuenta"
                : "Crea tu cuenta para empezar"}
            </p>

            <div className="flex rounded-lg bg-gray-900/50 p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === "login"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === "register"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Juan Pérez"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 w-full bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-gray-300">Nombre del negocio</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="Mi Tienda"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="pl-10 w-full bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 w-full bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() =>
                  setMode(mode === "login" ? "register" : "login")
                }
                className="text-green-500 font-medium hover:text-green-400"
              >
                {mode === "login" ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2025 Caiman-POS. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Auth;
