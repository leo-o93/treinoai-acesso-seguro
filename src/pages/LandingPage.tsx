import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dumbbell, 
  Apple, 
  Target, 
  Zap, 
  Users, 
  Award, 
  CheckCircle, 
  Star,
  ArrowRight,
  Brain,
  Clock,
  TrendingUp,
  Shield,
  Smartphone,
  Heart
} from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header/Navbar */}
      <nav className="bg-card/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">
                TrainerAI
              </span>
              <Badge className="ml-2 bg-primary text-primary-foreground">Powered by AI</Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#benefits" className="text-muted-foreground hover:text-foreground">Benefícios</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">Como Funciona</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">Preços</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Depoimentos</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/register">Começar Grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">🚀 Revolução Fitness com IA</Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Sua Transformação
              <span className="text-primary block">
                Começa Aqui
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Planos personalizados de treino e nutrição criados por Inteligência Artificial. 
              Resultados reais, acompanhamento inteligente e transformação garantida.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-lg px-8 py-4">
              <Link to="/register">
                Começar Transformação Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/10">
              Ver Como Funciona
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50k+</div>
              <div className="text-muted-foreground">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground">Taxa de Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15kg</div>
              <div className="text-muted-foreground">Perda Média</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">30 dias</div>
              <div className="text-muted-foreground">Resultados Visíveis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Por que escolher o TrainerAI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Revolucione sua jornada fitness com a mais avançada tecnologia de IA
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mb-4" />
                <CardTitle>IA Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Algoritmos avançados que aprendem com seus dados e criam planos únicos para você
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <Target className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Resultados Garantidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acompanhamento inteligente que ajusta seus planos para máxima eficiência
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <Clock className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Economia de Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Planos completos gerados em segundos. Mais tempo para focar nos resultados
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Progresso Contínuo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Análise em tempo real do seu progresso com ajustes automáticos
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Segurança Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Planos seguros baseados em ciência esportiva e nutrição validada
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <Smartphone className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Acesso Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Disponível 24/7 em qualquer dispositivo. Seu personal trainer no bolso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-muted-foreground">
              3 passos simples para sua transformação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Conte-nos sobre você
              </h3>
              <p className="text-muted-foreground mb-6">
                Responda um questionário rápido sobre seus objetivos, preferências e estilo de vida
              </p>
              <div className="flex justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">
                IA cria seu plano
              </h3>
              <p className="text-muted-foreground mb-6">
                Nossa IA analisa seus dados e gera planos personalizados de treino e nutrição
              </p>
              <div className="flex justify-center">
                <Brain className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Veja os resultados
              </h3>
              <p className="text-muted-foreground mb-6">
                Siga seu plano e acompanhe seu progresso com análises inteligentes em tempo real
              </p>
              <div className="flex justify-center">
                <Award className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Recursos Revolucionários
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Planos de Treino Inteligentes
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Exercícios adaptados ao seu nível</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Progressão automática de cargas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Vídeos explicativos para cada exercício</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Integração com dispositivos fitness</span>
                </div>
              </div>
            </div>
            <div className="bg-primary rounded-2xl p-8 text-primary-foreground">
              <Dumbbell className="w-16 h-16 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Treino Personalizado</h4>
              <p>IA analisa 50+ parâmetros para criar o treino perfeito para você</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <div className="bg-primary rounded-2xl p-8 text-primary-foreground md:order-2">
              <Apple className="w-16 h-16 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Nutrição Inteligente</h4>
              <p>Planos alimentares que se adaptam ao seu estilo de vida e preferências</p>
            </div>
            <div className="md:order-1">
              <h3 className="text-3xl font-bold mb-6">
                Nutrição Personalizada
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Cálculo automático de macros</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Receitas personalizadas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Lista de compras automática</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-primary mr-3" />
                  <span>Substituições inteligentes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Milhares de pessoas já transformaram suas vidas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Perdi 18kg em 4 meses seguindo o plano do TrainerAI. A IA realmente entende o que funciona para mim!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Maria Silva</div>
                    <div className="text-sm text-muted-foreground">Perdeu 18kg</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Nunca consegui ser consistente até conhecer o TrainerAI. Os planos se adaptam à minha rotina!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    J
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">João Santos</div>
                    <div className="text-sm text-muted-foreground">Ganhou 8kg de massa</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A personalização é incrível! Cada treino é diferente e desafiador. Recomendo para todos!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Ana Costa</div>
                    <div className="text-sm text-muted-foreground">Melhorou condicionamento</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Escolha seu plano
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece grátis e escale conforme seus resultados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Grátis</CardTitle>
                <div className="text-4xl font-bold">R$ 0</div>
                <div className="text-muted-foreground">Para sempre</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Planos básicos de treino
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Contador de calorias
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Chat com IA básico
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link to="/register">Começar Grátis</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary bg-card relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold">R$ 29</div>
                <div className="text-muted-foreground">por mês</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Planos avançados personalizados
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Análise completa de nutrição
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Receitas e listas de compras
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Integração com Strava
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Chat IA ilimitado
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90" asChild>
                  <Link to="/register">Começar Premium</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold">R$ 79</div>
                <div className="text-muted-foreground">por mês</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Tudo do Premium
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Consultoria 1:1 mensal
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Planos corporativos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    API personalizada
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link to="/register">Começar Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Pronto para transformar sua vida?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Junte-se a milhares de pessoas que já alcançaram seus objetivos com TrainerAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8 py-4" asChild>
              <Link to="/register">
                Começar Transformação Grátis
                <Heart className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
          <p className="text-primary-foreground/70 mt-4 text-sm">
            ✓ Sem compromisso ✓ Resultados em 30 dias ✓ Suporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4 text-primary">TrainerAI</div>
              <p className="text-muted-foreground">
                Revolução fitness com Inteligência Artificial. Transforme sua vida hoje.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Como Funciona</a></li>
                <li><a href="#" className="hover:text-foreground">Preços</a></li>
                <li><a href="#" className="hover:text-foreground">Recursos</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Carreiras</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground">Termos</a></li>
                <li><a href="#" className="hover:text-foreground">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 TrainerAI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
