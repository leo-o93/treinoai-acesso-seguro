
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 rounded-2xl animate-fade-in">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            TrainerAI © 2024 - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
