
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "@/lib/database";
import Navbar from "@/components/layout/Navbar";
import UserDataPanel from "@/components/dashboard/UserDataPanel";
import GoalSummary from "@/components/dashboard/GoalSummary";
import RecentActivities from "@/components/dashboard/RecentActivities";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import WebhookMonitor from "@/components/dashboard/WebhookMonitor";
import AIToolsMonitor from "@/components/dashboard/AIToolsMonitor";
import TrainerAIStats from "@/components/dashboard/TrainerAIStats";
import N8nWebhookMonitor from "@/components/dashboard/N8nWebhookMonitor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, User, Calendar, Target } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setUserProfile(profile);
          
          // Verificar se o perfil está completo
          const isComplete = profile && 
            profile.objetivo && 
            profile.peso && 
            profile.altura && 
            profile.frequencia_semanal;
          
          setProfileComplete(!!isComplete);
          
          // Se o perfil não estiver completo, redirecionar para a página de perfil
          if (!isComplete) {
            navigate('/perfil');
          }
        } catch (error) {
          console.error('Erro ao verificar perfil:', error);
          navigate('/perfil');
        }
      }
    };

    checkProfile();
  }, [user?.id, navigate]);

  // Se o perfil não estiver completo, mostrar mensagem de carregamento
  if (!profileComplete) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md text-center p-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <User className="w-6 h-6 text-blue-500" />
                    Bem-vindo ao TrainerAI!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Para começar, precisamos conhecer melhor você e seus objetivos.
                  </p>
                  <Button onClick={() => navigate('/perfil')} className="w-full">
                    Completar Perfil
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header com ações rápidas */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard TrainerAI</h1>
                <p className="text-gray-600 mt-1">
                  Bem-vindo de volta! Aqui está o resumo da sua jornada fitness.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat TrainerAI
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/plano')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Meu Plano
                </Button>
              </div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Coluna da esquerda - Dados do usuário */}
            <div className="lg:col-span-1 space-y-6">
              <UserDataPanel profile={userProfile} />
              <GoalSummary />
            </div>

            {/* Coluna central - Atividades e eventos */}
            <div className="lg:col-span-1 space-y-6">
              <RecentActivities />
              <UpcomingEvents />
            </div>

            {/* Coluna da direita - Monitoramento */}
            <div className="lg:col-span-1 space-y-6">
              <TrainerAIStats />
              <AIToolsMonitor />
            </div>
          </div>

          {/* Grid inferior - Monitoramento de sistemas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <N8nWebhookMonitor />
            <WebhookMonitor />
          </div>

          {/* Cards de ação rápida */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/chat')}>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Conversar com TrainerAI</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tire dúvidas, gere novos planos ou peça ajustes
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/plano')}>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Visualizar Plano</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Veja e agende seus treinos e refeições
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/perfil')}>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Atualizar Perfil</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ajuste seus objetivos e preferências
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
