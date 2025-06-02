
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import Index from "./pages/Index"
import Dashboard from "./pages/Dashboard"
import Perfil from "./pages/Perfil"
import PlanoAtual from "./pages/PlanoAtual"
import Integracoes from "./pages/Integracoes"
import Operator from "./pages/Operator"
import NotFound from "./pages/NotFound"
import SignIn from "./components/auth/SignIn"
import SignUp from "./components/auth/SignUp"
import ResetPassword from "./components/auth/ResetPassword"
import DetailedTrainingPlan from "./components/plans/DetailedTrainingPlan"
import DetailedNutritionPlan from "./components/plans/DetailedNutritionPlan"
import withAuth from "./components/auth/withAuth"

const queryClient = new QueryClient()

// Proteger rotas que precisam de autenticação
const ProtectedDashboard = withAuth(Dashboard)
const ProtectedPerfil = withAuth(Perfil)
const ProtectedPlanoAtual = withAuth(PlanoAtual)
const ProtectedIntegracoes = withAuth(Integracoes)
const ProtectedOperator = withAuth(Operator)
const ProtectedDetailedTrainingPlan = withAuth(DetailedTrainingPlan)
const ProtectedDetailedNutritionPlan = withAuth(DetailedNutritionPlan)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/cadastro" element={<SignUp />} />
            <Route path="/esqueci-senha" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="/perfil" element={<ProtectedPerfil />} />
            <Route path="/plano" element={<ProtectedPlanoAtual />} />
            <Route path="/plano/treino-detalhado" element={<ProtectedDetailedTrainingPlan />} />
            <Route path="/plano/nutricao-completa" element={<ProtectedDetailedNutritionPlan />} />
            <Route path="/integracoes" element={<ProtectedIntegracoes />} />
            <Route path="/operator" element={<ProtectedOperator />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
