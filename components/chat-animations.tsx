"use client"

import { useEffect } from "react"

// Estilos CSS personalizados para las animaciones
const customStyles = `
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export const ChatAnimations = () => {
  useEffect(() => {
    // Inyectar estilos en el head si no existen
    if (typeof document !== 'undefined' && !document.getElementById('chat-custom-styles')) {
      const styleSheet = document.createElement('style')
      styleSheet.id = 'chat-custom-styles'
      styleSheet.textContent = customStyles
      document.head.appendChild(styleSheet)
    }
  }, [])

  return null // Este componente no renderiza nada visible
} 