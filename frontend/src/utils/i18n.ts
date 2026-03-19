import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Header
      "tradepulse": "TradingBait",
      "testimonials": "Testimonials",
      "pricing": "Pricing",
      "login": "Login",
      "features": "Features",
      
      // Hero Section
      "master_trading_psychology": "Master Your Trading Psychology",
      "hero_description": "Join the elite group of traders using TradingBait's AI-powered trading journal for consistent profitability.",
      "get_started_now": "Get Started Now",
      "watch_demo": "Watch Demo",
      "professional_traders": "⚡ For serious traders only",
      
      // Features Section
      "trading_psychology_command_center": "🧠 Your Trading Psychology Command Center",
      "stop_trading_autopilot": "Stop Trading on Autopilot",
      "features_description": "95% of traders fail because they can't see their own patterns. TradingBait is the neurological microscope that reveals the hidden psychology behind every trade - then weaponizes those insights to make you consistently profitable.",
      
      // Feature Cards
      "neural_pattern_detection": "Neural Pattern Detection",
      "neural_pattern_desc": "Your subconscious is sabotaging you. Our AI analyzes your behavioral patterns, emotional triggers, and decision-making habits to identify the exact moments when discipline breaks down. Stop repeating the same costly mistakes.",
      
      "psychometric_journaling": "Psychometric Journaling",
      "psychometric_desc": "Turn chaos into clarity. Our intelligent journaling system correlates your mood, discipline scores, and market conditions with trade outcomes. Discover which emotional states make you money and which ones destroy your account. Data-driven self-awareness.",
      
      "streak_psychology_engine": "Streak Psychology Engine",
      "streak_desc": "Weaponize your winning psychology. Track discipline streaks, habit consistency, and mental state patterns. Our system identifies your peak performance conditions and helps you replicate them. Build unstoppable momentum.",
      
      "risk_vulnerability_mapping": "Risk Vulnerability Mapping",
      "risk_desc": "See your blind spots before they kill you. Advanced heatmaps reveal when, where, and why you take excessive risk. Time-of-day patterns, session analysis, and emotional state correlations show exactly when you're most vulnerable. Protect your capital intelligently.",
      
      "ai_performance_coach": "AI Performance Coach",
      "ai_coach_desc": "Your personal trading psychologist. Get real-time insights based on comprehensive analysis of your trading patterns, habits, and psychological state. Receive personalized recommendations to optimize your edge and eliminate performance leaks. Elite-level coaching, available 24/7.",
      
      "zero_friction_sync": "Zero-Friction Trade Sync",
      "sync_desc": "Never miss a data point. Seamless integration with cTrader and MetaTrader means every trade is automatically captured and analyzed. No manual entry, no missed insights, no excuses. Your complete trading DNA, captured effortlessly.",
      
      // Testimonials
      "trusted_by_traders": "Trusted by Profitable Traders",
      "testimonials_subtitle": "Hear what our users have to say about their experience with TradingBait.",
      
      // Pricing
      "find_perfect_plan": "Find the Perfect Plan",
      "pricing_subtitle": "Choose the plan that fits your trading style and goals.",
      "pro": "Pro",
      "pro_description": "For the serious trader who wants to take their performance to the next level.",
      "month": "/mo",
      "advanced_analytics": "Advanced Analytics",
      "automated_journaling": "Automated Journaling",
      "ai_powered_insights": "AI-Powered Insights",
      "get_started": "Get Started",
      "enterprise": "Enterprise",
      "enterprise_description": "For trading teams and institutions.",
      "custom": "Custom",
      "everything_in_pro": "Everything in Pro",
      "team_management": "Team Management",
      "priority_support": "Priority Support",
      "contact_sales": "Contact Sales",
      
      // Footer
      "all_rights_reserved": "© 2024 TradingBait. All rights reserved.",
      "terms_of_service": "Terms of Service",
      "privacy": "Privacy"
    }
  },
  es: {
    translation: {
      // Header
      "tradepulse": "TradingBait",
      "testimonials": "Testimonios",
      "pricing": "Precios",
      "login": "Iniciar Sesión",
      "features": "Características",
      
      // Hero Section
      "master_trading_psychology": "Domina Tu Psicología de Trading",
      "hero_description": "Únete al grupo élite de traders que utilizan el diario de trading potenciado por IA de TradingBait para rentabilidad consistente.",
      "get_started_now": "Comienza Ahora",
      "watch_demo": "Ver Demo",
      "professional_traders": "⚡ Solo para traders serios",
      
      // Features Section
      "trading_psychology_command_center": "🧠 Tu Centro de Comando de Psicología de Trading",
      "stop_trading_autopilot": "Deja de Operar en Piloto Automático",
      "features_description": "El 95% de los traders fallan porque no pueden ver sus propios patrones. TradingBait es el microscopio neurológico que revela la psicología oculta detrás de cada operación - luego convierte esas percepciones en armas para hacerte consistentemente rentable.",
      
      // Feature Cards
      "neural_pattern_detection": "Detección de Patrones Neurales",
      "neural_pattern_desc": "Tu subconsciente te está saboteando. Nuestra IA analiza tus patrones de comportamiento, disparadores emocionales y hábitos de toma de decisiones para identificar los momentos exactos cuando la disciplina se rompe. Deja de repetir los mismos errores costosos.",
      
      "psychometric_journaling": "Diario Psicométrico",
      "psychometric_desc": "Convierte el caos en claridad. Nuestro sistema inteligente de diario correlaciona tu estado de ánimo, puntajes de disciplina y condiciones del mercado con resultados de operaciones. Descubre qué estados emocionales te hacen dinero y cuáles destruyen tu cuenta. Autoconciencia basada en datos.",
      
      "streak_psychology_engine": "Motor de Psicología de Rachas",
      "streak_desc": "Convierte en arma tu psicología ganadora. Rastrea rachas de disciplina, consistencia de hábitos y patrones de estado mental. Nuestro sistema identifica las condiciones de tu máximo rendimiento y te ayuda a replicarlas. Construye momentum imparable.",
      
      "risk_vulnerability_mapping": "Mapeo de Vulnerabilidad de Riesgo",
      "risk_desc": "Ve tus puntos ciegos antes de que te maten. Los mapas de calor avanzados revelan cuándo, dónde y por qué tomas riesgo excesivo. Patrones de hora del día, análisis de sesión y correlaciones de estado emocional muestran exactamente cuándo eres más vulnerable. Protege tu capital inteligentemente.",
      
      "ai_performance_coach": "Coach de Rendimiento IA",
      "ai_coach_desc": "Tu psicólogo de trading personal. Obtén insights en tiempo real basados en análisis integral de tus patrones de trading, hábitos y estado psicológico. Recibe recomendaciones personalizadas para optimizar tu ventaja y eliminar fugas de rendimiento. Coaching de nivel élite, disponible 24/7.",
      
      "zero_friction_sync": "Sincronización Sin Fricción",
      "sync_desc": "Nunca pierdas un punto de datos. La integración perfecta con cTrader y MetaTrader significa que cada operación se captura y analiza automáticamente. Sin entrada manual, sin insights perdidos, sin excusas. Tu ADN de trading completo, capturado sin esfuerzo.",
      
      // Testimonials
      "trusted_by_traders": "Confiado por Traders Rentables",
      "testimonials_subtitle": "Escucha lo que nuestros usuarios tienen que decir sobre su experiencia con TradingBait.",
      
      // Pricing
      "find_perfect_plan": "Encuentra el Plan Perfecto",
      "pricing_subtitle": "Elige el plan que se adapte a tu estilo de trading y objetivos.",
      "pro": "Pro",
      "pro_description": "Para el trader serio que quiere llevar su rendimiento al siguiente nivel.",
      "month": "/mes",
      "advanced_analytics": "Análisis Avanzados",
      "automated_journaling": "Diario Automatizado",
      "ai_powered_insights": "Insights Potenciados por IA",
      "get_started": "Comenzar",
      "enterprise": "Empresarial",
      "enterprise_description": "Para equipos de trading e instituciones.",
      "custom": "Personalizado",
      "everything_in_pro": "Todo en Pro",
      "team_management": "Gestión de Equipos",
      "priority_support": "Soporte Prioritario",
      "contact_sales": "Contactar Ventas",
      
      // Footer
      "all_rights_reserved": "© 2024 TradingBait. Todos los derechos reservados.",
      "terms_of_service": "Términos de Servicio",
      "privacy": "Privacidad"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // Default language
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
