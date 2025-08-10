// Toggle menú móvil + accesibilidad (cierra al hacer clic en un enlace)
const btn = document.querySelector('.nav__toggle');
const menu = document.getElementById('navmenu');
if (btn && menu){
  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.setAttribute('aria-expanded', String(!expanded));
  });
  menu.addEventListener('click', (e)=>{
    if (e.target.matches('a')){
      btn.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-expanded','false');
    }
  });
}

// Sombra al hacer scroll en la nav
const navbar = document.getElementById('navbar');
const onScroll = ()=>{
  if(!navbar) return;
  navbar.style.boxShadow = (window.scrollY>24) ? '0 6px 24px rgba(0,0,0,.35)' : 'none';
};
window.addEventListener('scroll', onScroll, { passive:true });

// Activar enlace del menú según sección visible
(function(){
  const links = Array.from(document.querySelectorAll('.nav__links a'));
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        const id = '#'+e.target.id;
        const link = links.find(l => l.getAttribute('href')===id);
        if(!link) return;
        if(e.isIntersecting){ links.forEach(l=>l.classList.remove('active')); link.classList.add('active'); }
      });
    },{ rootMargin:'-45% 0px -50% 0px', threshold:0.01 });
    sections.forEach(s=>io.observe(s));
  }
})();

// Reveal al hacer scroll (animaciones suaves)
(function(){
  const targets = document.querySelectorAll('.reveal, .card, .service, .section__title');
  if(!targets.length) return;
  targets.forEach(el=>el.classList.add('reveal'));
  const io = new IntersectionObserver(ents=>{
    ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } });
  },{ threshold:0.08 });
  targets.forEach(el=>io.observe(el));
})();

// Botón Volver arriba + Sticky CTA hide near footer
(function(){
  const toTop = document.getElementById('toTop');
  const sticky = document.querySelector('.sticky-cta');
  const footer = document.querySelector('footer');

  const onWinScroll = ()=>{
    if(toTop){
      if(window.scrollY > 400) toTop.classList.add('show'); else toTop.classList.remove('show');
    }
  };
  window.addEventListener('scroll', onWinScroll, { passive:true });
  onWinScroll();

  if(toTop){
    toTop.addEventListener('click', ()=>{
      window.scrollTo({ top:0, behavior:'smooth' });
    });
  }

  if(sticky && footer){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ sticky.style.opacity = '0'; sticky.style.pointerEvents='none'; }
        else{ sticky.style.opacity = ''; sticky.style.pointerEvents=''; }
      });
    },{ threshold:0.01 });
    io.observe(footer);
  }
})();

// Modo claro/oscuro con persistencia
(function(){
  const root = document.documentElement;
  const btnTheme = document.getElementById('themeToggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const saved = localStorage.getItem('mt-theme');
  const initial = saved || (prefersLight ? 'light' : 'dark');

  const apply = (theme)=>{
    if(theme==='light'){
      root.setAttribute('data-theme','light');
      if(btnTheme) btnTheme.textContent='☀️';
      if(metaTheme) metaTheme.setAttribute('content','#ffffff');
    } else {
      root.setAttribute('data-theme','dark');
      if(btnTheme) btnTheme.textContent='🌙';
      if(metaTheme) metaTheme.setAttribute('content','#0f1419');
    }
  };

  apply(initial);

  btnTheme && btnTheme.addEventListener('click',()=>{
    const next = root.getAttribute('data-theme')==='light' ? 'dark' : 'light';
    localStorage.setItem('mt-theme', next);
    apply(next);
  });
})();

// ===== Multistep form =====
const form = document.getElementById('leadForm');
const formMsg = document.getElementById('formMsg');
(function(){
  if(!form) return;
  const steps = Array.from(form.querySelectorAll('.step'));
  const pills = Array.from(form.querySelectorAll('.steps__item'));
  let i = 0;

  const show = (idx)=>{
    steps.forEach((s,k)=>{ s.hidden = k!==idx; s.classList.toggle('is-current', k===idx); });
    pills.forEach((p,k)=>{ p.classList.toggle('is-active', k===idx); });
  };

  const validateStep = ()=>{
    const current = steps[i];
    const inputs = current.querySelectorAll('input, select, textarea');
    for(const el of inputs){
      if(el.hasAttribute('required') && !String(el.value || '').trim()){
        el.focus();
        return false;
      }
    }
    return true;
  };

  form.addEventListener('click', (e)=>{
    const next = e.target.closest('.js-next');
    const prev = e.target.closest('.js-prev');
    if(next){
      if(!validateStep()) return;
      i = Math.min(i+1, steps.length-1);
      show(i);
    }
    if(prev){
      i = Math.max(i-1, 0);
      show(i);
    }
  });

  show(0);
})();

// Envío del formulario mejorado con tracking y mejor UX
if(form){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(formMsg) formMsg.textContent = 'Enviando…';

    const fd = new FormData(form);
    // Honeypot opcional (añade <input name="website" class="sr-only" tabindex="-1" autocomplete="off"> en el HTML)
    if(fd.get('website')){ if(formMsg) formMsg.textContent=''; return; }

    // Agregar timestamp y fuente
    fd.append('timestamp', new Date().toISOString());
    fd.append('source', 'website');
    fd.append('user_agent', navigator.userAgent);

    try{
      const res = await fetch(form.action, {
        method:'POST',
        body: fd,
        mode:'cors'
      });
      
      if(!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      // Éxito
      if(formMsg) {
        formMsg.innerHTML = '🎉 <strong>¡Listo!</strong> Te contactamos en las próximas 24 horas.';
        formMsg.style.color = '#22c55e';
      }
      
      form.reset();
      
      // Mostrar mensaje de agradecimiento
      setTimeout(() => {
        if(formMsg) {
          formMsg.innerHTML = '💬 Mientras tanto, puedes chatear con <strong>Mishi AI</strong> para resolver dudas rápidas.';
        }
      }, 3000);
      
      // Tracking del evento (si tienes Google Analytics)
      if(typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
          event_category: 'engagement',
          event_label: 'lead_form'
        });
      }
      
    }catch(err){
      console.error('Form submission error:', err);
      if(formMsg) {
        formMsg.innerHTML = '❌ Error de conexión. <a href="#contacto" onclick="location.reload()">Intentar nuevamente</a>';
        formMsg.style.color = '#ef4444';
      }
    }
  });
}

// ===== Funcionalidades adicionales para botones =====
(function(){
  // Tracking de clics en botones importantes
  const trackButton = (element, action, category = 'button') => {
    if(typeof gtag !== 'undefined') {
      gtag('event', 'click', {
        event_category: category,
        event_label: action
      });
    }
    console.log(`Button clicked: ${action}`);
  };

  // Botones de CTA principales
  document.querySelectorAll('a[href="#contacto"]').forEach(btn => {
    btn.addEventListener('click', () => {
      trackButton(btn, 'cta_contact', 'conversion');
    });
  });

  // Botones de suscripción
  document.querySelectorAll('.btn--primary, .btn--ghost').forEach(btn => {
    if(btn.textContent.includes('Comenzar') || btn.textContent.includes('VIP')) {
      btn.addEventListener('click', () => {
        trackButton(btn, 'subscription_interest', 'conversion');
      });
    }
  });

  // Botón del regalo secreto
  const giftLink = document.querySelector('a[href*="drive.google.com"]');
  if(giftLink) {
    giftLink.addEventListener('click', () => {
      trackButton(giftLink, 'gift_download', 'engagement');
      
      // Mostrar mensaje de confirmación
      setTimeout(() => {
        if(confirm('🎁 ¡Genial! El regalo se está abriendo. ¿Te gustaría agendar una consulta gratuita para maximizar su uso?')) {
          document.querySelector('#contacto').scrollIntoView({ behavior: 'smooth' });
        }
      }, 1000);
    });
  }

  // WhatsApp button tracking
  const waButton = document.querySelector('.wa-float');
  if(waButton) {
    waButton.addEventListener('click', () => {
      trackButton(waButton, 'whatsapp_contact', 'conversion');
    });
  }
})();

// ===== Mejoras en la navegación =====
(function(){
  // Smooth scroll mejorado para todos los enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if(targetElement) {
        const offsetTop = targetElement.offsetTop - 80; // Compensar navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
        
        // Cerrar menú móvil si está abierto
        const menu = document.getElementById('navmenu');
        const toggle = document.querySelector('.nav__toggle');
        if(menu && toggle) {
          menu.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });
})();

// ===== Notificaciones toast =====
(function(){
  const showToast = (message, type = 'info', duration = 3000) => {
    // Crear toast si no existe
    let toast = document.getElementById('toast');
    if(!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(toast);
    }

    // Estilos según tipo
    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    
    // Mostrar
    toast.style.transform = 'translateX(0)';
    
    // Ocultar después del tiempo especificado
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
    }, duration);
  };

  // Hacer disponible globalmente
  window.showToast = showToast;
})();

// ===== Exit-intent modal (mejorado - menos molesto) =====
(function(){
  const modal = document.getElementById('exitOffer');
  if(!modal) return;
  const overlay = modal.querySelector('[data-close]');
  const closeBtn = modal.querySelector('.modal__close');
  
  let showCount = parseInt(localStorage.getItem('mt-exit-count') || '0');
  let lastShown = parseInt(localStorage.getItem('mt-exit-last') || '0');
  const now = Date.now();
  
  const open = ()=>{ 
    modal.removeAttribute('hidden'); 
    modal.setAttribute('aria-hidden','false'); 
    document.body.style.overflow='hidden';
    // Registrar que se mostró
    showCount++;
    localStorage.setItem('mt-exit-count', showCount.toString());
    localStorage.setItem('mt-exit-last', now.toString());
  };
  
  const close = ()=>{ 
    modal.setAttribute('hidden',''); 
    modal.setAttribute('aria-hidden','true'); 
    document.body.style.overflow=''; 
  };

  // Lógica mejorada: mostrar máximo 3 veces, con 30 minutos entre cada muestra
  const canShow = () => {
    if (showCount >= 3) return false; // Máximo 3 veces total
    if (now - lastShown < 30 * 60 * 1000) return false; // 30 minutos entre muestras
    return true;
  };

  if(canShow()){
    let exitTriggered = false;
    
    const handler = (e)=>{
      if(exitTriggered) return;
      if(e.clientY <= 0 || e.relatedTarget === null){
        exitTriggered = true;
        open();
        document.removeEventListener('mouseout', handler);
      }
    };
    
    document.addEventListener('mouseout', handler);
    
    // Fallback móvil: tras 45s si no hay interacción (más tiempo)
    setTimeout(()=>{
      if(exitTriggered) return;
      exitTriggered = true;
      open();
    }, 45000);
  }

  [overlay, closeBtn].forEach(el=> el && el.addEventListener('click', close));

  // Cerrar con Escape (accesibilidad)
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
  });
})();

// ===== Gift countdown (24h desde primera visita) =====
(function(){
  const el = document.getElementById('giftCountdown');
  if(!el) return;
  const KEY = 'mt-gift-deadline';
  let deadline = localStorage.getItem(KEY);
  if(!deadline){
    deadline = String(Date.now() + 24*60*60*1000);
    localStorage.setItem(KEY, deadline);
  }
  const target = new Date(parseInt(deadline,10));
  const pad = (n)=> String(n).padStart(2,'0');
  const tick = ()=>{
    const now = new Date();
    let diff = target - now;
    if(diff <= 0){ el.textContent = '00:00:00'; return; }
    const h = Math.floor(diff/3.6e6); diff -= h*3.6e6;
    const m = Math.floor(diff/6e4);   diff -= m*6e4;
    const s = Math.floor(diff/1e3);
    el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  tick();
  setInterval(tick, 1000);
})();

// ===== Responsive adjustments for floating elements =====
(function(){
  const chatbot = document.getElementById('aiChatbot');
  const waFloat = document.querySelector('.wa-float');
  const chatToggle = document.getElementById('chatbotToggle');
  
  const adjustFloatingElements = () => {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;
    
    if (chatbot && waFloat) {
      if (isMobile) {
        // En móvil, ajustar posiciones para evitar superposición
        chatbot.style.right = '10px';
        chatbot.style.bottom = '80px';
        chatbot.style.width = 'calc(100vw - 20px)';
        chatbot.style.maxWidth = '360px';
        chatbot.style.height = '450px';
        
        waFloat.style.right = '10px';
        waFloat.style.bottom = '80px';
        waFloat.style.width = '48px';
        waFloat.style.height = '48px';
        
        // Cuando el chatbot está abierto, mover WhatsApp más abajo
        if (chatbot.getAttribute('aria-hidden') === 'false') {
          waFloat.style.bottom = '140px';
        }
      } else if (isTablet) {
        // En tablet, posiciones intermedias
        chatbot.style.right = '16px';
        chatbot.style.bottom = '90px';
        waFloat.style.right = '16px';
        waFloat.style.bottom = '90px';
      } else {
        // En desktop, posiciones originales
        chatbot.style.right = '20px';
        chatbot.style.bottom = '100px';
        waFloat.style.right = '16px';
        waFloat.style.bottom = '100px';
      }
    }
  };
  
  // Ajustar al cargar y al redimensionar
  adjustFloatingElements();
  window.addEventListener('resize', adjustFloatingElements, { passive: true });
  
  // Observar cambios en el chatbot para ajustar WhatsApp
  if (chatbot && waFloat) {
    const observer = new MutationObserver(() => {
      adjustFloatingElements();
    });
    observer.observe(chatbot, { attributes: true, attributeFilter: ['aria-hidden'] });
  }
})();

// ===== Chatbot con IA =====
(function(){
  const chatbot = document.getElementById('aiChatbot');
  const toggle = document.getElementById('chatbotToggle');
  const closeBtn = chatbot?.querySelector('.chatbot__close');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const typing = document.getElementById('chatTyping');
  const notification = document.getElementById('chatNotification');

  if (!chatbot || !toggle) return;

  let isOpen = false;
  let messageCount = 0;

  // Base de conocimiento del chatbot
  const knowledge = {
    servicios: {
      keywords: ['servicios', 'servicio', 'qué hacen', 'ofrecen', 'automatización', 'desarrollo'],
      response: '🤖 Ofrecemos:\n\n• **Automatización con IA** - Flujos inteligentes con n8n/Make\n• **Chatbots Inteligentes** - Atención 24/7 conectada a tu CRM\n• **Análisis de Datos** - Dashboards y métricas accionables\n• **Consultoría Tecnológica** - Estrategia con ROI real\n• **Optimización de Procesos** - Integraciones y capacitación\n\n¿Te interesa algún servicio en particular?'
    },
    precios: {
      keywords: ['precio', 'costo', 'cuánto', 'tarifa', 'presupuesto', 'inversión'],
      response: '💰 Los precios varían según el proyecto:\n\n• **Consultoría inicial**: GRATUITA\n• **Automatizaciones simples**: Desde $500\n• **Chatbots personalizados**: Desde $800\n• **Sistemas completos**: Desde $2000\n\nCada proyecto es único. ¿Te gustaría una **consulta gratuita** para evaluar tu caso específico?'
    },
    n8n: {
      keywords: ['n8n', 'make', 'zapier', 'automatización', 'flujos', 'workflow'],
      response: '⚡ **n8n** es una plataforma de automatización súper poderosa:\n\n• Conecta +400 aplicaciones\n• Flujos visuales fáciles de entender\n• Código abierto y personalizable\n• Ideal para automatizar tareas repetitivas\n\nPor ejemplo: Cuando llega un email → Extrae datos → Los guarda en Sheets → Envía notificación por WhatsApp\n\n¿Qué proceso te gustaría automatizar?'
    },
    consulta: {
      keywords: ['consulta', 'contacto', 'hablar', 'reunión', 'cita', 'agendar'],
      response: '📞 ¡Perfecto! Te ayudo a agendar tu **consulta gratuita**:\n\n✅ **30 minutos** de análisis personalizado\n✅ **Propuesta específica** para tu negocio\n✅ **Sin compromiso** - solo valor\n\n¿Prefieres que te contactemos por:\n• WhatsApp: +51 999 999 999\n• Email: contacto@michitech.com\n• O completa el formulario en la página\n\n¡Hablemos de cómo automatizar tu negocio!'
    },
    tiempo: {
      keywords: ['tiempo', 'cuánto tarda', 'duración', 'plazo', 'entrega'],
      response: '⏱️ **Tiempos de implementación**:\n\n• **Automatizaciones simples**: 1-2 semanas\n• **Chatbots básicos**: 1-3 semanas\n• **Integraciones complejas**: 2-4 semanas\n• **Sistemas completos**: 1-3 meses\n\nTrabajamos por **fases** para que veas resultados rápido. La mayoría de clientes ven ROI en el primer mes.\n\n¿Tienes algún proyecto específico en mente?'
    },
    whatsapp: {
      keywords: ['whatsapp', 'wa', 'chat', 'mensajes', 'api'],
      response: '💬 **WhatsApp Business API** es increíble para:\n\n• Respuestas automáticas 24/7\n• Integración con tu CRM\n• Envío masivo personalizado\n• Chatbots inteligentes\n• Notificaciones automáticas\n\nPodemos conectar WhatsApp con Google Sheets, n8n, tu web y más.\n\n¿Quieres automatizar tu atención por WhatsApp?'
    },
    ia: {
      keywords: ['ia', 'inteligencia artificial', 'ai', 'gpt', 'openai', 'chatgpt'],
      response: '🧠 **Inteligencia Artificial** que implementamos:\n\n• **Chatbots inteligentes** con GPT\n• **Análisis de documentos** (OCR + IA)\n• **Clasificación automática** de emails/tickets\n• **Generación de contenido** personalizado\n• **Análisis predictivo** de datos\n\nLa IA no reemplaza a tu equipo, lo **potencia**. ¿En qué área te gustaría implementar IA?'
    }
  };

  // Respuestas por defecto
  const defaultResponses = [
    '🤔 Interesante pregunta. Te recomiendo agendar una **consulta gratuita** para darte una respuesta más específica.',
    '💡 Esa es una excelente pregunta. Cada caso es único, ¿te gustaría que hablemos por **WhatsApp** para darte más detalles?',
    '🎯 Para darte la mejor respuesta, necesito conocer más sobre tu negocio. ¿Agendamos una **consulta gratuita**?'
  ];

  // Funciones del chatbot
  const openChat = () => {
    isOpen = true;
    chatbot.setAttribute('aria-hidden', 'false');
    input.focus();
    hideNotification();
  };

  const closeChat = () => {
    isOpen = false;
    chatbot.setAttribute('aria-hidden', 'true');
  };

  const hideNotification = () => {
    if (notification) notification.style.display = 'none';
  };

  const showTyping = () => {
    typing.style.display = 'flex';
    messages.scrollTop = messages.scrollHeight;
  };

  const hideTyping = () => {
    typing.style.display = 'none';
  };

  const addMessage = (text, isUser = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot__message ${isUser ? 'chatbot__message--user' : 'chatbot__message--bot'}`;
    
    if (!isUser) {
      messageDiv.innerHTML = `
        <div class="chatbot__avatar-small">
          <img src="img/mishi-mini.png" width="24" height="24" alt="Mishi">
        </div>
        <div class="chatbot__bubble">${text}</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="chatbot__bubble">${text}</div>
      `;
    }

    // Remover sugerencias anteriores
    const oldSuggestions = messages.querySelector('.chatbot__suggestions');
    if (oldSuggestions) oldSuggestions.remove();

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    messageCount++;
  };

  const findResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Buscar en la base de conocimiento
    for (const [key, data] of Object.entries(knowledge)) {
      if (data.keywords.some(keyword => message.includes(keyword))) {
        return data.response;
      }
    }

    // Respuesta por defecto
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const processMessage = async (userMessage) => {
    addMessage(userMessage, true);
    showTyping();

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    hideTyping();
    const response = findResponse(userMessage);
    addMessage(response);

    // Agregar sugerencias después de algunas interacciones
    if (messageCount > 2 && Math.random() > 0.6) {
      addSuggestions();
    }
  };

  const addSuggestions = () => {
    const suggestions = [
      '¿Cuánto cuesta?',
      'Quiero una consulta',
      '¿Cómo funciona n8n?',
      'Automatizar WhatsApp'
    ];

    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'chatbot__suggestions';
    
    suggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = 'chatbot__suggestion';
      btn.textContent = suggestion;
      btn.addEventListener('click', () => {
        processMessage(suggestion);
        suggestionsDiv.remove();
      });
      suggestionsDiv.appendChild(btn);
    });

    messages.appendChild(suggestionsDiv);
    messages.scrollTop = messages.scrollHeight;
  };

  // Event listeners
  toggle.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  // Sugerencias iniciales
  messages.addEventListener('click', (e) => {
    if (e.target.classList.contains('chatbot__suggestion')) {
      const message = e.target.dataset.message || e.target.textContent;
      processMessage(message);
    }
  });

  // Formulario de chat
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (message) {
      processMessage(message);
      input.value = '';
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeChat();
    }
  });

  // Mostrar notificación después de 10 segundos
  setTimeout(() => {
    if (!isOpen && notification) {
      notification.style.display = 'grid';
    }
  }, 10000);
})();

// ===== Marquee del stack (Web Animations API) =====
document.addEventListener('DOMContentLoaded', function(){
  const band = document.querySelector('.brand-band.marquee');
  if(!band) return;
  const list = band.querySelector('.brand-list');
  if(!list) return;

  // Pista + lista duplicada (para loop)
  const track = document.createElement('div');
  track.className = 'brand-track';
  band.insertBefore(track, list);
  track.appendChild(list);
  const clone = list.cloneNode(true);
  clone.setAttribute('aria-hidden','true');
  track.appendChild(clone);

  let anim;

  const distance = () => list.scrollWidth; // px exactos de una lista

  const computeDuration = () => {
    const d = distance();
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    // ~18s por viewport de recorrido, tope 18–45s
    return Math.max(18, Math.min(45, Math.round((d / vw) * 18)));
  };

  const start = () => {
    const d = distance();
    const duration = computeDuration() * 1000;
    let progress = 0;
    if (anim) {
      const timing = anim.effect.getComputedTiming();
      progress = (anim.currentTime % timing.duration) / timing.duration;
      anim.cancel();
    }
    anim = track.animate(
      [{ transform: 'translate3d(0,0,0)' }, { transform: `translate3d(-${d}px,0,0)` }],
      { duration, iterations: Infinity, easing: 'linear' }
    );
    if (progress) anim.currentTime = progress * duration;
  };

  start();
  window.addEventListener('resize', start, { passive:true });

  const SLOW_RATE = 0.55;
  band.addEventListener('mouseenter', () => anim && (anim.playbackRate = SLOW_RATE));
  band.addEventListener('mouseleave', () => anim && (anim.playbackRate = 1));
});