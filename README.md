
# TrainerAI - Acesso Seguro

Uma interface de autenticação completa e moderna para a plataforma TrainerAI, construída com React, TypeScript, Tailwind CSS e integração com Supabase Auth.

## 🚀 Recursos

- ✅ Login e cadastro com email/senha
- ✅ Reset de senha por email
- ✅ Autenticação OAuth (Google e Apple) - opcional
- ✅ Sessões persistentes com Supabase
- ✅ Rotas protegidas com HOC
- ✅ Design responsivo e moderno
- ✅ Modo escuro suportado
- ✅ Feedback visual com toasts
- ✅ Validação de formulários
- ✅ Acessibilidade otimizada

## 🛠️ Tecnologias

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework de CSS utilitário
- **Shadcn/UI** - Componentes de interface
- **Supabase** - Backend como serviço
- **React Router** - Roteamento
- **Lucide Icons** - Ícones

## ⚙️ Configuração

### 1. Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase

### 2. Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd trainerai-auth

# Instale as dependências
npm install
```

### 3. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Vá em Settings > API
3. Copie a URL e a Anon Key

### 4. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
VITE_SUPABASE_ENABLE_OAUTH=true  # opcional para OAuth
```

### 5. Configuração OAuth (Opcional)

Para habilitar login com Google/Apple:

1. No Supabase Dashboard, vá em Authentication > Settings
2. Configure os provedores OAuth desejados
3. Defina `VITE_SUPABASE_ENABLE_OAUTH=true`

### 6. Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthLayout.tsx      # Layout base para autenticação
│   │   ├── SignIn.tsx          # Tela de login
│   │   ├── SignUp.tsx          # Tela de cadastro
│   │   ├── ResetPassword.tsx   # Reset de senha
│   │   ├── OAuthButtons.tsx    # Botões OAuth
│   │   └── withAuth.tsx        # HOC para rotas protegidas
│   └── ui/                     # Componentes Shadcn/UI
├── lib/
│   └── supabase.ts            # Cliente e helpers do Supabase
├── pages/
│   ├── Dashboard.tsx          # Dashboard protegido
│   └── NotFound.tsx          # Página 404
└── App.tsx                   # Roteamento principal
```

## 🔐 Autenticação

### Fluxo de Login

1. Usuário insere email/senha
2. Supabase valida credenciais
3. Sessão é criada automaticamente
4. Redirecionamento para `/dashboard`

### Rotas Protegidas

Use o HOC `withAuth` para proteger páginas:

```tsx
import withAuth from '@/components/auth/withAuth'

const MinhaPageProtegida = () => {
  return <div>Conteúdo protegido</div>
}

export default withAuth(MinhaPageProtegida)
```

### Verificação de Sessão

```tsx
import { getCurrentSession, getCurrentUser } from '@/lib/supabase'

// Verificar se há sessão ativa
const session = await getCurrentSession()

// Obter dados do usuário
const user = await getCurrentUser()
```

## 🎨 Customização

### Cores

As cores primárias podem ser alteradas no `tailwind.config.ts`:

```ts
primary: {
  DEFAULT: '#10b981', // emerald-500
  foreground: '#ffffff',
  hover: '#059669', // emerald-600
}
```

### Layouts

O `AuthLayout` pode ser customizado em `src/components/auth/AuthLayout.tsx`.

## 📱 Responsividade

- Mobile First design
- Breakpoints otimizados
- Touch-friendly interfaces
- Acessibilidade garantida

## 🧪 Testes

```bash
# Lighthouse (acessibilidade)
npm run build
npm run preview
# Abra o DevTools > Lighthouse > Run audit
```

## 🚀 Deploy

```bash
# Build para produção
npm run build

# Os arquivos estarão em dist/
```

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:

- Abra uma issue no GitHub
- Consulte a [documentação do Supabase](https://supabase.com/docs)
- Consulte a [documentação do Shadcn/UI](https://ui.shadcn.com)
