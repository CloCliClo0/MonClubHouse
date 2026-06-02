type LogoProps = {
  size?: number
  variant?: 'full' | 'icon' | 'white'
  className?: string
}

export default function Logo({ size = 40, variant = 'icon', className = '' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Fond arrondi */}
        <rect width="40" height="40" rx="10" fill="#0f5238" />
        {/* Maison stylisée */}
        <path d="M20 8L8 18V32H16V24H24V32H32V18L20 8Z" fill="white" opacity="0.15" />
        <path d="M20 9L9 18.5V31H15.5V23.5H24.5V31H31V18.5L20 9Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        {/* Ballon de foot simplifié au centre */}
        <circle cx="20" cy="21" r="5.5" fill="white" />
        <path d="M20 15.5 L18 18.5 L20 21.5 L22 18.5 Z" fill="#0f5238" />
        <path d="M14.5 21 L17.5 19.5 L17.5 22.5 Z" fill="#0f5238" />
        <path d="M25.5 21 L22.5 19.5 L22.5 22.5 Z" fill="#0f5238" />
        <path d="M16 25.5 L18.5 23.5 L21.5 23.5 L24 25.5" stroke="#0f5238" strokeWidth="1" fill="none" />
      </svg>
    )
  }

  if (variant === 'white') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15" />
        <path d="M20 9L9 18.5V31H15.5V23.5H24.5V31H31V18.5L20 9Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <circle cx="20" cy="21" r="5.5" fill="white" fillOpacity="0.9" />
        <path d="M20 15.5 L18 18.5 L20 21.5 L22 18.5 Z" fill="#0f5238" />
        <path d="M14.5 21 L17.5 19.5 L17.5 22.5 Z" fill="#0f5238" />
        <path d="M25.5 21 L22.5 19.5 L22.5 22.5 Z" fill="#0f5238" />
      </svg>
    )
  }

  // Variant 'full' : logo + texte
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0f5238" />
        <path d="M20 9L9 18.5V31H15.5V23.5H24.5V31H31V18.5L20 9Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <circle cx="20" cy="21" r="5.5" fill="white" />
        <path d="M20 15.5 L18 18.5 L20 21.5 L22 18.5 Z" fill="#0f5238" />
        <path d="M14.5 21 L17.5 19.5 L17.5 22.5 Z" fill="#0f5238" />
        <path d="M25.5 21 L22.5 19.5 L22.5 22.5 Z" fill="#0f5238" />
      </svg>
      <div>
        <p className="text-white font-black text-xl leading-none tracking-tight">MonClubHouse</p>
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Sports Management</p>
      </div>
    </div>
  )
}
