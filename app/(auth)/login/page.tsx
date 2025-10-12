"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, TrendingUp, BarChart3, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Limpar query params da URL ao carregar a página
  useEffect(() => {
    // Remove qualquer parâmetro da URL (como ?error=CredentialsSignin)
    if (window.location.search) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log("Form submitted");
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("Attempting login for:", email);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      console.log("Login result:", result);

      if (result?.error) {
        console.error("Login error:", result.error);
        setError("Email ou senha inválidos");
      } else if (result?.ok) {
        console.log("Login successful, redirecting...");
        // Redirecionar sem expor dados
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Exception during login:", error);
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
    
    return false;
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Lado Esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Newsletter Metrics</h1>
          </div>
          
          <div className="space-y-6 mt-16">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Transforme dados em<br />
              decisões inteligentes
            </h2>
            <p className="text-blue-100 text-lg">
              Monitore, analise e otimize suas newsletters com métricas em tempo real
            </p>
          </div>
        </div>

        {/* Cards de features flutuantes */}
        <div className="relative z-10 space-y-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Analytics Avançado</h3>
                <p className="text-blue-100 text-sm">Insights detalhados do seu público</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Newsletter Metrics</h1>
          </div>

          {/* Card de Login */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo de volta!</h2>
              <p className="text-slate-600">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5"  noValidate>
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 bg-slate-50 border-slate-300 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Funcionalidade em desenvolvimento');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 bg-slate-50 border-slate-300 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Botão de Login */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 mt-8">
            © 2025 Newsletter Metrics. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
