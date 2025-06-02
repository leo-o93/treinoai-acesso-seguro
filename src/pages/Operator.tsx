
import React from 'react'
import ConversationManager from '@/components/operator/ConversationManager'
import withAuth from '@/components/auth/withAuth'

const Operator: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ConversationManager />
    </div>
  )
}

export default withAuth(Operator)
