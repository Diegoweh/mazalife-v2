'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

/* ── Types ── */
interface CartItem { id: string; name: string; icon: string; price: number; colorClass: string; qty: number; }
type Cart = Record<string, CartItem>;

/* ── Constants ── */
const VENUE_DATA: Record<string, Omit<CartItem, 'qty'>> = {
  shekinah:     { id: 'shekinah',     name: 'Shekinah Beach Club', icon: '🏖', price: 400, colorClass: 'venue-shekinah' },
  farolesa:     { id: 'farolesa',     name: 'Farolesa del Faro',   icon: '🦅', price: 600, colorClass: 'venue-farolesa' },
  observatorio: { id: 'observatorio', name: 'Observatorio 1873',   icon: '🔭', price: 500, colorClass: 'venue-observatorio' },
  munba:        { id: 'munba',        name: 'Munba + Expeditions', icon: '🐋', price: 350, colorClass: 'venue-munba' },
  mansion:      { id: 'mansion',      name: 'Mansión Pirata',      icon: '💀', price: 350, colorClass: 'venue-mansion' },
};

const VENUE_BG: Record<string, string> = {
  'venue-shekinah':     'linear-gradient(135deg,#006B7A,#00BCD4)',
  'venue-farolesa':     'linear-gradient(135deg,#1B5E20,#4CAF50)',
  'venue-observatorio': 'linear-gradient(135deg,#E65100,#F5A623)',
  'venue-munba':        'linear-gradient(135deg,#0D3D6B,#1E6DB5)',
  'venue-mansion':      'linear-gradient(135deg,#880E4F,#E91E8C)',
};

const COMBOS: Record<string, string[]> = {
  relax:    ['shekinah', 'munba'],
  aventura: ['shekinah', 'farolesa', 'observatorio', 'munba'],
  familia:  ['observatorio', 'munba', 'mansion'],
};

const HERO_SLIDES = [
  '/images/Slides_1.webp',
  '/images/Slides_2.webp',
  '/images/Slides_3.webp',
  '/images/Slides_4.webp',
  '/images/Slides_5.webp',
];

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  /* ── State ── */
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [vermasOpen, setVermasOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [paying, setPaying] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  /* ── Computed ── */
  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);

  /* ── Reveal on scroll ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Navbar scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Lock body scroll when modals open ── */
  useEffect(() => {
    document.body.style.overflow = (cartOpen || checkoutOpen || successOpen || vermasOpen) ? 'hidden' : '';
  }, [cartOpen, checkoutOpen, successOpen, vermasOpen]);

  /* ── Hero carousel ── */
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(intervalId);
  }, []);

  /* ── Toast ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  /* ── Cart actions ── */
  const addToCart = useCallback((id: string) => {
    const v = VENUE_DATA[id];
    setCart((prev) => {
      const next = { ...prev };
      if (next[id]) next[id] = { ...next[id], qty: next[id].qty + 1 };
      else next[id] = { ...v, qty: 1 };
      return next;
    });
    setAddedMap((prev) => ({ ...prev, [id]: true }));
    showToast(`${v.icon} ${v.name} agregado al plan`);
  }, [showToast]);

  const changeQty = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return next;
      const newQty = next[id].qty + delta;
      if (newQty <= 0) {
        delete next[id];
        setAddedMap((m) => ({ ...m, [id]: false }));
      } else {
        next[id] = { ...next[id], qty: newQty };
      }
      return next;
    });
  }, []);

  const addCombo = useCallback((combo: string) => {
    const ids = COMBOS[combo] || [];
    setCart((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        const v = VENUE_DATA[id];
        if (next[id]) next[id] = { ...next[id], qty: next[id].qty + 1 };
        else next[id] = { ...v, qty: 1 };
      });
      return next;
    });
    setAddedMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[id] = true; });
      return next;
    });
    showToast('🎒 Paquete agregado al plan');
    setCartOpen(true);
  }, [showToast]);

  /* ── Checkout (demo) ── */
  const processPayment = async () => {
    const name = (document.getElementById('clientName') as HTMLInputElement)?.value.trim();
    const email = (document.getElementById('clientEmail') as HTMLInputElement)?.value.trim();
    if (!name || !email) { showToast('⚠ Por favor completa tu nombre y email'); return; }
    setPaying(true);
    await new Promise((r) => setTimeout(r, 2000));
    setPaying(false);
    setCheckoutOpen(false);
    setCart({});
    setAddedMap({});
    setSuccessOpen(true);
  };

  /* ── WhatsApp message ── */
  const buildWAMessage = () => {
    const items = Object.values(cart);
    if (!items.length) return;
    let msg = 'Hola, me interesa reservar en Mazalife:%0A%0A';
    items.forEach((i) => { msg += `${i.icon} ${i.name} × ${i.qty} persona(s)%0A`; });
    msg += `%0ATotal estimado: $${cartTotal.toLocaleString()} MXN`;
    window.open(`https://wa.me/526691234567?text=${msg}`, '_blank');
  };

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ══ RENDER ══════════════════════════════════════════════════ */
  return (
    <>
      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-10 h-[72px] bg-white/95 backdrop-blur-md border-b border-black/[.06] transition-shadow duration-300 ${scrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.10)]' : ''} max-sm:px-5`}>
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-azul rounded-[10px] flex items-center justify-center font-heading text-[18px] font-extrabold text-white tracking-[-1px]">ML</div>
          <div className="font-heading text-[22px] font-extrabold tracking-widest">
            <span className="text-azul">MAZA</span><span className="text-naranja">LIFE</span>
          </div>
        </a>
        <ul className="flex gap-8 list-none max-md:hidden">
          {[['#venues','Experiencias'],['#combos','Paquetes'],['#opiniones','Opiniones'],['#contacto','Contacto']].map(([href,label])=>(
            <li key={href}><a href={href} className="text-sm font-medium text-gris hover:text-azul transition-colors">{label}</a></li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a href="https://wa.me/526691234567" target="_blank" className="bg-[#25D366] text-white px-[18px] py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity">💬 WhatsApp</a>
          <button onClick={() => setCartOpen(true)} className="relative bg-azul text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-azul-dark hover:-translate-y-px transition-all">
            🛒 Mi plan
            {cartCount > 0 && <span className="bg-naranja text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="inicio" className="min-h-screen bg-gradient-to-br from-[#0D3D6B] via-[#1E6DB5] to-[#00BCD4] flex flex-col justify-center items-start px-20 pt-24 pb-20 relative overflow-hidden max-sm:px-6 max-sm:pb-36">
        <div className="absolute inset-0">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-in-out ${index === activeHeroSlide ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,25,43,0.82)_0%,rgba(13,61,107,0.62)_42%,rgba(0,188,212,0.3)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,27,45,0.18)_0%,rgba(10,27,45,0.5)_100%)]" />
        </div>

        {/* decorative circles */}
        <div className="absolute -top-[120px] -right-[120px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)'}} />
        <div className="absolute -bottom-20 left-[30%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(0,188,212,0.3) 0%, transparent 70%)'}} />

        <div className="relative z-10">
          <div className="anim-0 inline-block bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-full px-[18px] py-1.5 text-[13px] font-semibold tracking-[2px] uppercase mb-7">Mazatlán · Tourism &amp; Entertainment</div>
          <h1 className="anim-1 font-display font-black text-white leading-[0.95] max-w-[700px] mb-7" style={{fontSize:'clamp(52px, 8vw, 96px)'}}>
            Vive<br/>Mazatlán<br/><em className="not-italic text-naranja block">de verdad.</em>
          </h1>
          <p className="anim-2 text-lg text-white/80 max-w-[480px] leading-[1.65] mb-11 font-light">
            Cinco experiencias únicas para que tu viaje sea <br/>más que playa y malecón. Reserva hoy, vive mañana.
          </p>
          <div className="anim-3 flex gap-4 flex-wrap mb-8">
            <button onClick={() => scrollToId('venues')} className="bg-naranja text-white px-9 py-4 rounded-full text-base font-bold shadow-[0_4px_20px_rgba(245,166,35,0.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(245,166,35,0.5)] transition-all">Ver experiencias →</button>
            <button onClick={() => scrollToId('combos')} className="bg-white/15 backdrop-blur-sm border-2 border-white/40 text-white px-8 py-[14px] rounded-full text-base font-semibold hover:bg-white/25 transition-colors">Ver paquetes</button>
          </div>
          <div className="anim-5 flex items-center gap-2.5">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide}
                type="button"
                aria-label={`Ir al slide ${index + 1}`}
                onClick={() => setActiveHeroSlide(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeHeroSlide ? 'w-10 bg-naranja' : 'w-2.5 bg-white/55 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
        <div className="anim-5 absolute bottom-12 left-20 right-20 flex gap-3 flex-wrap max-sm:bottom-6 max-sm:left-6 max-sm:right-6">
          {[['shekinah','Shekinah Beach Club'],['farolesa','Farolesa del Faro'],['observatorio','Observatorio 1873'],['munba','Munba'],['mansion','Mansión Pirata']].map(([id,label])=>(
            <button key={id} onClick={()=>scrollToId(id)} className="bg-white/12 backdrop-blur-sm border border-white/20 text-white rounded-full px-5 py-2 text-[13px] font-medium hover:bg-naranja/25 hover:border-naranja hover:text-naranja transition-all">→ {label}</button>
          ))}
        </div>
      </section>

      {/* ═══ STRIP ═══ */}
      <div className="bg-azul px-10 py-5 flex gap-12 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[['☀','Beach Club premium'],['🦅','Tirolesa del Faro'],['🔭','Observatorio 1873'],['🐋','Museo Ballena'],['💀','Mansión Pirata'],['✅','Reserva en línea'],['🔒','Pago seguro Stripe'],['📍','Mazatlán, Sinaloa']].map(([icon,text])=>(
          <div key={text} className="font-heading text-[15px] font-semibold tracking-[2px] uppercase flex-shrink-0 text-white/75">
            <span className="text-naranja mr-2">{icon}</span>{text}
          </div>
        ))}
      </div>

      {/* ═══ INTRO ═══ */}
      <section className="bg-white">
        <div className="reveal grid grid-cols-2 gap-20 items-center max-w-[1280px] mx-auto px-20 py-24 max-lg:grid-cols-1 max-lg:px-6 max-lg:py-16 max-lg:gap-12">
          <div>
            <div className="font-heading text-xs tracking-[4px] uppercase text-azul font-bold mb-4">¿Por qué Mazalife?</div>
            <h2 className="font-display font-bold leading-[1.1] mb-6" style={{fontSize:'clamp(36px,4vw,56px)'}}>El Mazatlán que no<br/>encuentras en <em className="text-naranja not-italic">TripAdvisor</em></h2>
            <p className="text-[17px] text-gris leading-[1.75] mb-4">Mazalife reúne las experiencias más auténticas y emocionantes de la ciudad. Desde adrenalina pura hasta historia y naturaleza, todo pensado para que tu familia regrese queriendo más.</p>
            <p className="text-[17px] text-gris leading-[1.75]">Reserva todo en un solo lugar, paga de forma segura y recibe confirmación inmediata. Sin colas, sin incertidumbre.</p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              {[['5','Experiencias únicas en Mazatlán'],['+25K','Visitantes felices cada año'],['4.8★','Calificación promedio'],['100%','Pago seguro garantizado']].map(([num,label])=>(
                <div key={num} className="bg-arena rounded-2xl p-6">
                  <div className="font-heading text-[42px] font-extrabold text-azul leading-none mb-1">{num}</div>
                  <div className="text-[13px] text-gris font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="relative w-full h-[480px] rounded-3xl overflow-hidden">
              <Image
                src="/images/Slides_1.webp"
                alt="Mazatlan desde el aire"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-negro/20 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-8 max-lg:left-0 bg-white rounded-2xl px-5 py-4 shadow-[0_16px_48px_rgba(0,0,0,0.14)] flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-naranja flex items-center justify-center text-[22px]">🌊</div>
              <div>
                <strong className="block text-[15px] text-negro">Temporada alta</strong>
                <span className="text-xs text-gris">Dic – Abr · Alta demanda</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VENUES HEADER ═══ */}
      <div id="venues" className="reveal text-center pt-20 pb-0 px-6 max-w-[700px] mx-auto">
        <div className="font-heading text-xs tracking-[4px] uppercase font-bold mb-3.5 text-azul">Las 5 experiencias</div>
        <h2 className="font-display font-bold leading-[1.15] mb-4" style={{fontSize:'clamp(32px,5vw,52px)'}}>Elige las tuyas.<br/>Combínalas. Vívelas.</h2>
        <p className="text-[17px] text-gris leading-[1.7] font-light">Agrega al carrito las experiencias que quieres y reserva todo en un solo pago. Tu confirmación llega en segundos.</p>
      </div>

      {/* ═══ VENUES ═══ */}
      <section className="py-16">
        {VENUES.map((v, i) => (
          <VenueBlock key={v.id} venue={v} index={i} added={!!addedMap[v.id]} onAdd={() => addToCart(v.id)} onVerMas={v.id === 'shekinah' ? () => setVermasOpen(true) : undefined} />
        ))}
      </section>

      {/* ═══ COMBOS ═══ */}
      <section id="combos" className="bg-arena py-24 px-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="reveal text-center pt-0 px-6 max-w-[700px] mx-auto mb-14">
            <div className="font-heading text-xs tracking-[4px] uppercase font-bold mb-3.5 text-naranja">Paquetes especiales</div>
            <h2 className="font-display font-bold leading-[1.15] mb-4" style={{fontSize:'clamp(32px,5vw,52px)'}}>Más experiencias,<br/>mejor precio</h2>
            <p className="text-[17px] text-gris leading-[1.7] font-light">Combina venues y ahorra. Paquetes armados para cada tipo de viajero.</p>
          </div>
          <div className="reveal grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <ComboCard icon="🌊" name="Plan Relax" desc="Para quienes quieren sol, mar y buena vibra. El plan perfecto para parejas y grupos de amigos." includes={['Shekinah Beach Club','Munba (museo)']} oldPrice="$750" newPrice="$680" save="-9%" featured={false} onAdd={() => addCombo('relax')} />
            <ComboCard icon="🦅" name="Plan Aventura Total" desc="La experiencia completa de Mazatlán. Adrenalina, playa, historia y naturaleza en un solo paquete." includes={['Shekinah Beach Club','Farolesa del Faro','Observatorio 1873','Munba + Expeditions']} oldPrice="$1,850" newPrice="$1,550" save="-16%" featured onAdd={() => addCombo('aventura')} />
            <ComboCard icon="👨‍👩‍👧‍👦" name="Plan Familia" desc="Diseñado para que niños y adultos disfruten por igual. Historia, misterio y naturaleza marina." includes={['Observatorio 1873','Munba + Expeditions','Mansión Pirata']} oldPrice="$1,200" newPrice="$1,050" save="-12%" featured={false} onAdd={() => addCombo('familia')} />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIOS ═══ */}
      <section id="opiniones" className="py-24 px-10 max-w-[1280px] mx-auto">
        <div className="reveal text-center pt-0 px-6 max-w-[700px] mx-auto mb-14">
          <div className="font-heading text-xs tracking-[4px] uppercase font-bold mb-3.5 text-azul">Lo que dicen</div>
          <h2 className="font-display font-bold leading-[1.15]" style={{fontSize:'clamp(32px,5vw,52px)'}}>Viajeros que ya<br/>vivieron Mazalife</h2>
        </div>
        <div className="reveal grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          <TestimonioCard stars={5} text='"La Farolesa del Faro fue lo más emocionante que hice en mis vacaciones. La vista es increíble y el equipo de seguridad te hace sentir muy seguro. ¡Mis hijos no querían bajar!"' name="Alejandro R." city="Monterrey, NL" initial="A" color="#1E6DB5" />
          <TestimonioCard stars={5} text='"Shekinah es otro nivel. Fuimos en el puente de Semana Santa y reservamos por la web — súper fácil. Llegamos y ya teníamos todo listo. El atardecer desde la alberca es impresionante."' name="Valeria M." city="Ciudad de México" initial="V" color="#E91E8C" />
          <TestimonioCard stars={5} text='"El Observatorio 1873 nos sorprendió muchísimo. No esperábamos tan buen contenido. La guía sabía todo sobre la historia de Mazatlán. Definitivamente lo recomendaría."' name="Carlos T." city="Torreón, Coahuila" initial="C" color="#4CAF50" />
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section id="contacto" className="text-center py-28 px-10 relative overflow-hidden" style={{background:'linear-gradient(135deg,#0D3D6B 0%,#1E6DB5 50%,#00BCD4 100%)'}}>
        <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(245,166,35,0.2) 0%, transparent 60%)'}} />
        <h2 className="font-display font-black text-white leading-[1.05] mb-5 relative" style={{fontSize:'clamp(36px,6vw,72px)'}}>Mazatlán te espera.<br/><em className="text-naranja not-italic">¿Estás listo?</em></h2>
        <p className="text-lg text-white/75 max-w-[520px] mx-auto mb-11 leading-[1.65] relative">Reserva hoy y asegura tu lugar. Confirmación inmediata, pago 100% seguro, cancelación flexible.</p>
        <div className="flex gap-4 justify-center flex-wrap relative">
          <button onClick={() => scrollToId('venues')} className="bg-naranja text-white px-9 py-4 rounded-full text-base font-bold shadow-[0_4px_20px_rgba(245,166,35,0.4)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(245,166,35,0.5)] transition-all">Reservar ahora →</button>
          <a href="https://wa.me/526691234567" target="_blank" className="bg-white/15 backdrop-blur-sm border-2 border-white/40 text-white px-8 py-[14px] rounded-full text-base font-semibold hover:bg-white/25 transition-colors">💬 Hablar con nosotros</a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-negro text-white/60 px-20 pt-16 pb-8 max-lg:px-6">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-12 max-w-[1280px] mx-auto mb-12 max-lg:grid-cols-2 max-lg:gap-8">
          <div>
            <div className="font-heading text-[26px] font-extrabold tracking-wide mb-3">
              <span className="text-azul">MAZA</span><span className="text-naranja">LIFE</span>
            </div>
            <div className="text-xs uppercase tracking-[3px] mb-4">Tourism &amp; Entertainment</div>
            <div className="text-sm leading-[1.7] max-w-[280px]">Las experiencias más auténticas de Mazatlán reunidas en un solo lugar. Grupo Petroil · Mazatlán, Sinaloa.</div>
          </div>
          <FooterCol title="Experiencias" links={[['#shekinah','Shekinah Beach Club'],['#farolesa','Farolesa del Faro'],['#observatorio','Observatorio 1873'],['#munba','Munba'],['#mansion','Mansión Pirata']]} />
          <FooterCol title="Paquetes" links={[['#combos','Plan Relax'],['#combos','Plan Aventura Total'],['#combos','Plan Familia']]} />
          <FooterCol title="Contacto" links={[['https://wa.me/526691234567','WhatsApp'],['mailto:hola@mazalife.com.mx','hola@mazalife.com.mx'],['#','Mazatlán, Sinaloa']]} />
        </div>
        <div className="border-t border-white/[.08] pt-6 max-w-[1280px] mx-auto flex justify-between items-center flex-wrap gap-3">
          <p className="text-[13px]">© 2025 Mazalife · Grupo Petroil · Mazatlán, Sinaloa</p>
          <p className="text-[13px]"><a href="#" className="text-white/40 hover:text-naranja transition-colors">Aviso de privacidad</a> · <a href="#" className="text-white/40 hover:text-naranja transition-colors">Términos y condiciones</a></p>
          <p className="text-[13px]">Powered by <a href="https://proyecta.com.mx" className="text-white/40 hover:text-naranja transition-colors">Proyecta</a></p>
        </div>
      </footer>

      {/* ═══ WA FLOAT ═══ */}
      <a href="https://wa.me/526691234567?text=Hola%2C%20quiero%20informes%20sobre%20Mazalife" target="_blank"
        className="fixed bottom-7 right-7 z-[1500] bg-[#25D366] text-white w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px] shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_8px_32px_rgba(37,211,102,0.5)] transition-all">
        💬
      </a>

      {/* ═══ CART OVERLAY ═══ */}
      <div onClick={() => setCartOpen(false)} className={`fixed inset-0 bg-black/50 backdrop-blur z-[2000] transition-opacity duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="px-7 py-7 pb-5 border-b border-gris-light flex justify-between items-center flex-shrink-0">
          <div className="font-heading text-[22px] font-extrabold tracking-wide uppercase text-negro">🗺 Mi Plan</div>
          <button onClick={() => setCartOpen(false)} className="bg-gris-light rounded-full w-9 h-9 flex items-center justify-center text-xl text-gris hover:bg-gray-200 transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {cartCount === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="text-[56px] mb-4">🗺</div>
              <h3 className="text-lg font-bold text-negro mb-2">Tu plan está vacío</h3>
              <p className="text-sm text-gris">Agrega experiencias para armar tu itinerario perfecto en Mazatlán.</p>
            </div>
          ) : (
            Object.values(cart).map((item) => (
              <div key={item.id} className="flex gap-4 items-start py-4 border-b border-gris-light">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background: VENUE_BG[item.colorClass]}}>{item.icon}</div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-negro mb-1">{item.name}</div>
                  <div className="text-xs text-gris">${item.price.toLocaleString()} MXN / persona</div>
                  <div className="flex items-center gap-2.5 mt-2">
                    <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full bg-gris-light flex items-center justify-center text-base font-bold text-negro hover:bg-gray-200 transition-colors">−</button>
                    <span className="text-[15px] font-bold min-w-5 text-center">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-full bg-gris-light flex items-center justify-center text-base font-bold text-negro hover:bg-gray-200 transition-colors">+</button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-heading text-lg font-extrabold text-azul">${(item.price * item.qty).toLocaleString()}</div>
                  <button onClick={() => changeQty(item.id, -item.qty)} className="text-gris text-lg hover:text-red-500 transition-colors">✕</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cartCount > 0 && (
          <div className="px-7 pb-7 pt-5 border-t border-gris-light flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gris">Total a pagar</span>
              <span className="font-heading text-[28px] font-extrabold text-negro">${cartTotal.toLocaleString()} MXN</span>
            </div>
            <div className="text-xs text-gris mb-5">Precios por persona · Incluye impuestos</div>
            <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="w-full py-[18px] bg-naranja text-white rounded-full text-base font-bold flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(245,166,35,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,166,35,0.45)] transition-all">🔒 Reservar y pagar</button>
            <button onClick={buildWAMessage} className="w-full py-3.5 bg-[#25D366] text-white rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 mt-3 hover:opacity-90 transition-opacity">💬 Reservar por WhatsApp</button>
            <div className="flex justify-center gap-1.5 mt-4 opacity-40 text-xs text-gris items-center">🔒 Pago seguro · Stripe · Visa · MC · AMEX</div>
          </div>
        )}
      </div>

      {/* ═══ CHECKOUT MODAL ═══ */}
      <div className={`checkout-overlay fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-6 transition-opacity duration-300 ${checkoutOpen ? 'open opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="checkout-modal-inner bg-white rounded-3xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.18)] p-10">
          <div className="mb-7">
            <h3 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-negro mb-1.5">🔒 Reservar experiencias</h3>
            <p className="text-sm text-gris">Pago seguro · Confirmación inmediata</p>
          </div>
          <div className="bg-arena rounded-2xl p-5 mb-7">
            {Object.values(cart).map((i) => (
              <div key={i.id} className="flex justify-between text-sm mb-2 text-negro">
                <span>{i.icon} {i.name} × {i.qty}</span>
                <span>${(i.price * i.qty).toLocaleString()} MXN</span>
              </div>
            ))}
            <div className="flex justify-between pt-2.5 border-t border-black/[.08] font-bold text-base text-negro mt-2">
              <span>Total</span><span>${cartTotal.toLocaleString()} MXN</span>
            </div>
          </div>
          {[['clientName','Nombre completo','text','Tu nombre'],['clientEmail','Email','email','tu@email.com'],['clientPhone','WhatsApp (para confirmación)','tel','+52 669 000 0000']].map(([id,label,type,ph])=>(
            <div key={id} className="mb-4">
              <label className="block text-[13px] font-semibold text-negro mb-1.5">{label}</label>
              <input id={id} type={type} placeholder={ph} className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-[15px] text-negro outline-none focus:border-azul focus:shadow-[0_0_0_3px_rgba(30,109,181,0.12)] transition-all" />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-negro mb-1.5">Datos de tarjeta</label>
            <div id="stripe-card-element" />
            <div id="card-errors" className="text-red-500 text-[13px] mt-1.5 min-h-[18px]" />
          </div>
          <div className="flex gap-3 mt-7">
            <button onClick={() => setCheckoutOpen(false)} className="px-6 py-4 bg-gris-light text-gris rounded-full text-[15px] font-semibold hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={processPayment} disabled={paying} className="flex-1 py-4 bg-azul text-white rounded-full text-base font-bold flex items-center justify-center gap-2 hover:bg-azul-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {paying ? '⏳ Procesando...' : '🔒 Pagar ahora'}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gris">🔒 Procesado por Stripe · 256-bit SSL</div>
        </div>
      </div>

      {/* ═══ SUCCESS MODAL ═══ */}
      <div className={`fixed inset-0 bg-black/70 z-[4000] flex items-center justify-center p-6 transition-opacity duration-300 ${successOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-3xl w-full max-w-[440px] p-12 text-center shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
          <div className="text-[72px] mb-5">🎉</div>
          <h3 className="font-display text-[28px] font-bold mb-3">¡Reserva confirmada!</h3>
          <p className="text-[15px] text-gris leading-[1.7] mb-7">Hemos enviado la confirmación a tu correo y WhatsApp. Te esperamos en Mazatlán. ¡Va a ser increíble!</p>
          <button onClick={() => setSuccessOpen(false)} className="bg-azul text-white px-9 py-3.5 rounded-full text-[15px] font-bold hover:bg-azul-dark transition-colors">¡Perfecto, gracias!</button>
        </div>
      </div>

      {/* ═══ VER MÁS MODAL — SHEKINAH ═══ */}
      <div onClick={(e) => { if (e.target === e.currentTarget) setVermasOpen(false); }}
        className={`vermas-overlay fixed inset-0 bg-black/65 backdrop-blur-sm z-[3500] flex items-center justify-center p-6 transition-opacity duration-300 ${vermasOpen ? 'open opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="vermas-modal-inner bg-white rounded-[28px] w-full max-w-[780px] max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
          {/* hero */}
          <div className="h-[280px] rounded-t-[28px] relative overflow-hidden flex items-end p-7" style={{background:'linear-gradient(180deg,#006B7A 0%,#00BCD4 55%,#4EDFE8 100%)'}}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] opacity-[.18] pointer-events-none">🏖</div>
            <button onClick={() => setVermasOpen(false)} className="absolute top-5 right-5 z-10 bg-black/30 backdrop-blur rounded-full w-[38px] h-[38px] flex items-center justify-center text-white text-xl hover:bg-black/55 transition-colors">×</button>
            <div className="relative z-[2]">
              <div className="inline-block bg-white/18 backdrop-blur border border-white/30 text-white rounded-full px-4 py-1 text-xs font-semibold tracking-[2px] uppercase mb-2.5">🌊 Beach Club · Mazatlán</div>
              <h2 className="font-display text-[38px] font-black text-white leading-none">Shekinah<br/>Beach Club</h2>
            </div>
          </div>
          {/* body */}
          <div className="p-9 pb-10">
            <div className="text-[10px] tracking-[3px] uppercase text-gris font-bold mb-3 font-heading">Galería</div>
            <div className="grid grid-cols-4 gap-2.5 mb-8">
              {[['linear-gradient(135deg,#006B7A,#00BCD4)','🌅'],['linear-gradient(135deg,#00838F,#26C6DA)','🏊'],['linear-gradient(135deg,#00796B,#26A69A)','🍹'],['linear-gradient(135deg,#0277BD,#29B6F6)','🌊']].map(([bg,icon],i)=>(
                <div key={i} className="rounded-xl aspect-square flex items-center justify-center text-3xl hover:scale-[1.04] transition-transform" style={{background:bg}}>{icon}</div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-7 mb-7 max-sm:grid-cols-1">
              <div className="bg-arena rounded-2xl p-5">
                <div className="font-heading text-[10px] tracking-[3px] uppercase text-gris font-bold mb-3">⏰ Horarios</div>
                {[['Lunes – Viernes','10am – 7pm'],['Sábado','9am – 8pm'],['Domingo','9am – 7pm'],['Último acceso','1hr antes cierre']].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm py-[7px] border-b border-black/[.06] last:border-0 text-negro">
                    <span>{k}</span><span className="font-semibold text-azul">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-arena rounded-2xl p-5">
                <div className="font-heading text-[10px] tracking-[3px] uppercase text-gris font-bold mb-3">🎟 Tarifas</div>
                {[['Adulto','$400 MXN'],['Niño (3–12 años)','$300 MXN'],['Menor de 3 años','Gratis'],['Consumo mínimo','Incluido']].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm py-[7px] border-b border-black/[.06] last:border-0 text-negro">
                    <span>{k}</span><span className="font-semibold text-azul">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-7">
              <div className="font-heading text-[10px] tracking-[3px] uppercase text-gris font-bold mb-3">✅ Qué incluye tu entrada</div>
              <div className="grid grid-cols-2 gap-2.5">
                {['Acceso a alberca infinity','Playa privada con servicio','Tumbona + sombrilla reservada','Consumo mínimo en A&B','Casilleros y vestidores','Estacionamiento incluido','Música en vivo (fin de semana)','Vista panorámica al Pacífico'].map((item)=>(
                  <div key={item} className="flex items-center gap-2 text-[13px] text-negro font-medium px-3.5 py-2.5 bg-gris-light rounded-[10px]">
                    <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />{item}
                  </div>
                ))}
              </div>
            </div>
            <a href="https://maps.google.com/?q=Shekinah+Beach+Club+Mazatlan" target="_blank"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl h-40 mb-7 border border-[#B3E5FC] cursor-pointer hover:opacity-85 transition-opacity no-underline"
              style={{background:'linear-gradient(135deg,#E3F2FD 0%,#B3E5FC 100%)'}}>
              <div className="text-[36px]">📍</div>
              <div className="text-sm font-semibold text-azul">Shekinah Beach Club</div>
              <div className="text-xs text-gris">Ver en Google Maps · Zona Dorada, Mazatlán</div>
            </a>
            <div className="bg-[#FFF8E1] rounded-xl p-5 mb-7 border border-[#FFE082]">
              <div className="text-xs font-bold text-[#E65100] uppercase tracking-[2px] mb-2.5">Políticas importantes</div>
              <ul className="flex flex-col gap-1.5">
                {['Reservación en línea asegura lugar — especialmente en temporada alta y fines de semana.','Se requiere presentar confirmación (email o pantalla) al ingreso.','No se permiten alimentos o bebidas externas.','Menores de edad deben ingresar acompañados de un adulto responsable.','Cancelación gratuita hasta 48 horas antes de la fecha reservada.'].map((p)=>(
                  <li key={p} className="text-[13px] text-[#5D4037] flex items-start gap-[7px]"><span className="text-xs flex-shrink-0 mt-px">⚠</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1">
                <div className="font-heading text-[11px] text-gris tracking-[2px] uppercase">Desde <strong className="text-[32px] text-negro block leading-[1.1] font-heading">$400 MXN</strong></div>
                <div className="text-xs text-verde font-semibold flex items-center gap-1 mt-0.5">👦 Niño (3–12 años) $300 MXN</div>
              </div>
              <button onClick={() => { addToCart('shekinah'); setVermasOpen(false); }}
                className="bg-naranja text-white rounded-full px-7 py-3.5 text-[15px] font-bold flex items-center gap-2 shadow-[0_4px_16px_rgba(245,166,35,0.35)] hover:-translate-y-0.5 transition-all">
                + Agregar al plan
              </button>
              <button onClick={() => setVermasOpen(false)} className="px-5 py-3.5 bg-gris-light text-gris rounded-full text-[15px] font-semibold hover:bg-gray-200 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TOAST ═══ */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-negro text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-[0_16px_48px_rgba(0,0,0,0.14)] z-[5000] whitespace-nowrap transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        {toast}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   VENUE DATA
══════════════════════════════════════════════════════════════ */
interface VenueInfo {
  id: string; tag: string; tagColor: string; tagBg: string;
  imgClass: string; imgGrad: string; imageSrc: string; imageAlt: string; badge: string; icon: string;
  name: string; desc: string; highlights: string[];
  price: string; priceChild: string; childAge: string;
}

const VENUES: VenueInfo[] = [
  {
    id:'shekinah', tag:'🌊 Beach Club', tagColor:'#00BCD4', tagBg:'rgba(0,188,212,0.1)',
    imgGrad:'linear-gradient(180deg,#006B7A 0%,#00BCD4 60%,#4EDFE8 100%)',
    imgClass:'', imageSrc:'/images/shekina.webp', imageAlt:'Shekinah Beach Club en Mazatlan', badge:'Beach Club · Acceso todo el día', icon:'🏖',
    name:'Shekinah\nBeach Club',
    desc:'El beach club más exclusivo del Pacífico mexicano. Acceso directo a la playa, alberca infinity, servicio de mesa, música en vivo los fines de semana y el atardecer más fotografiado de Mazatlán.',
    highlights:['Acceso a playa privada y alberca infinity','Incluye consumo mínimo en alimentos y bebidas','Tumbonas y sombrillas reservadas','Vista panorámica al Océano Pacífico'],
    price:'$400', priceChild:'Niño (3–12 años) $300 MXN', childAge:'3–12',
  },
  {
    id:'farolesa', tag:'🦅 Aventura extrema', tagColor:'#4CAF50', tagBg:'rgba(76,175,80,0.1)',
    imgGrad:'linear-gradient(180deg,#1B5E20 0%,#4CAF50 60%,#81C784 100%)',
    imgClass:'', imageSrc:'/images/farolesa.webp', imageAlt:'Farolesa del Faro en Mazatlan', badge:'Tirolesa · Adrenalina pura', icon:'🦅',
    name:'Farolesa\ndel Faro',
    desc:'La tirolesa del Faro de Mazatlán — uno de los faros naturales más altos del mundo. Vuela sobre el océano con vistas incomparables a la ciudad y el Puerto de Mazatlán. Una experiencia que no olvidarás.',
    highlights:['Tirolesa desde el segundo faro natural más alto del mundo','Vista 360° a Mazatlán, el océano y las islas','Guías certificados y equipo de seguridad profesional','Duración del vuelo: 45–60 segundos de adrenalina'],
    price:'$600', priceChild:'Niño (6–12 años) $450 MXN', childAge:'6–12',
  },
  {
    id:'observatorio', tag:'🔭 Cultura e historia', tagColor:'#F5A623', tagBg:'rgba(245,166,35,0.1)',
    imgGrad:'linear-gradient(180deg,#E65100 0%,#F5A623 60%,#FFD54F 100%)',
    imgClass:'', imageSrc:'/images/observatorio.webp', imageAlt:'Observatorio 1873 en Mazatlan', badge:'Historia · Desde 1873', icon:'🔭',
    name:'Observatorio\n1873',
    desc:'El observatorio meteorológico más antiguo del Pacífico mexicano, restaurado y convertido en una experiencia cultural única. Conoce la historia de Mazatlán desde las alturas y observa las estrellas con telescopios de época.',
    highlights:['Recorrido guiado por el observatorio histórico restaurado','Exposición de astronomía y meteorología del siglo XIX','Sesión de observación estelar (sesiones nocturnas)','Galería fotográfica del Mazatlán histórico'],
    price:'$500', priceChild:'Niño (3–12 años) $375 MXN', childAge:'3–12',
  },
  {
    id:'munba', tag:'🐋 Naturaleza marina', tagColor:'#1E6DB5', tagBg:'rgba(30,109,181,0.1)',
    imgGrad:'linear-gradient(180deg,#0D3D6B 0%,#1E6DB5 60%,#64B5F6 100%)',
    imgClass:'', imageSrc:'/images/munba.webp', imageAlt:'Munba Expeditions en Mazatlan', badge:'Naturaleza · Ballenas jorobadas', icon:'🐋',
    name:'Munba +\nMunba Expeditions',
    desc:'El único museo de ballenas del Pacífico mexicano, con la experiencia de avistamiento de ballenas jorobadas más emocionante de la costa. Combina la exhibición educativa con una expedición real al mar.',
    highlights:['Museo interactivo dedicado a las ballenas jorobadas','Expedición marítima de avistamiento (temp. Nov–Mar)','Guías biólogos especializados en cetáceos','Ideal para niños: talleres educativos incluidos'],
    price:'$350', priceChild:'Niño (3–12 años) $265 MXN', childAge:'3–12',
  },
  {
    id:'mansion', tag:'💀 Entretenimiento', tagColor:'#E91E8C', tagBg:'rgba(233,30,140,0.1)',
    imgGrad:'linear-gradient(180deg,#880E4F 0%,#E91E8C 60%,#F48FB1 100%)',
    imgClass:'', imageSrc:'/images/mansion-pirata.webp', imageAlt:'Mansion Pirata en Mazatlan', badge:'Aventura · Escape room viviente', icon:'💀',
    name:'Mansión\nPirata',
    desc:'Una experiencia inmersiva donde te conviertes en el protagonista. Recorre la mansión más misteriosa del Puerto y descifra los secretos piratas que llevan siglos ocultos. Terror, aventura y diversión para toda la familia.',
    highlights:['Recorrido teatral inmersivo con actores en vivo','Historia original de los piratas del Pacífico','Experiencia apta para todas las edades (mayores de 8 años)','Duración: 60–90 minutos de aventura'],
    price:'$350', priceChild:'Niño (8–12 años) $265 MXN', childAge:'8–12',
  },
];

/* ══════════════════════════════════════════════════════════════
   VENUE BLOCK COMPONENT
══════════════════════════════════════════════════════════════ */
function VenueBlock({ venue, index, added, onAdd, onVerMas }: {
  venue: VenueInfo; index: number; added: boolean; onAdd: () => void; onVerMas?: () => void;
}) {
  const isEven = index % 2 === 1;
  return (
    <div id={venue.id} className="max-w-[1280px] mx-auto mb-20 px-10 last:mb-0 reveal max-sm:px-4">
      <div className={`grid grid-cols-2 gap-0 items-center rounded-[32px] overflow-hidden bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] hover:-translate-y-1.5 hover:shadow-[0_32px_80px_rgba(0,0,0,0.18)] transition-all duration-300 max-lg:grid-cols-1 ${isEven ? 'direction-rtl' : ''}`}>
        {/* image side */}
        <div className={`h-[520px] flex items-end p-8 relative overflow-hidden max-lg:h-[280px] ${isEven ? 'max-lg:order-first' : ''}`} style={{background: venue.imgGrad}}>
          <Image
            src={venue.imageSrc}
            alt={venue.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-negro/45 via-negro/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_100%)]" />
          <div className="relative z-[2] bg-black/35 backdrop-blur-sm text-white rounded-full px-[18px] py-2 text-[13px] font-semibold">{venue.badge}</div>
        </div>
        {/* content side */}
        <div className={`p-14 max-lg:p-8 ${isEven ? 'order-first' : ''}`}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide uppercase mb-5" style={{background: venue.tagBg, color: venue.tagColor}}>{venue.tag}</div>
          <h2 className="font-display font-bold leading-[1.1] mb-4 whitespace-pre-line" style={{fontSize:'clamp(28px,3.5vw,44px)'}}>{venue.name}</h2>
          <p className="text-base text-gris leading-[1.75] mb-7">{venue.desc}</p>
          <ul className="flex flex-col gap-2.5 mb-8 list-none">
            {venue.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-negro font-medium">
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background: venue.tagColor}}>✓</span>
                {h}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="font-heading text-[13px] font-bold tracking-wide uppercase text-gris">Desde</div>
              <div className="font-heading text-[28px] font-extrabold text-negro leading-none">{venue.price}</div>
              <div className="text-[11px] text-gris">MXN / adulto</div>
              <div className="text-xs text-verde font-semibold mt-1 flex items-center gap-1">👦 {venue.priceChild}</div>
            </div>
            <button onClick={onAdd}
              className={`rounded-full px-7 py-3.5 text-[15px] font-bold flex items-center gap-2 transition-all ${added ? 'bg-verde shadow-[0_4px_16px_rgba(76,175,80,0.35)]' : 'bg-naranja shadow-[0_4px_16px_rgba(245,166,35,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,166,35,0.45)]'} text-white`}>
              {added ? '✓ Agregado' : '+ Agregar al plan'}
            </button>
            {onVerMas && (
              <button onClick={onVerMas} className="text-azul text-sm font-semibold bg-azul-light rounded-full px-5 py-3.5 hover:bg-[#d0e8f7] transition-colors">Ver más ↗</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMBO CARD COMPONENT
══════════════════════════════════════════════════════════════ */
function ComboCard({ icon, name, desc, includes, oldPrice, newPrice, save, featured, onAdd }: {
  icon: string; name: string; desc: string; includes: string[]; oldPrice: string; newPrice: string; save: string; featured: boolean; onAdd: () => void;
}) {
  return (
    <div className={`bg-white rounded-3xl p-9 relative shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.14)] transition-all overflow-hidden ${featured ? 'border-2 border-naranja' : ''}`}>
      {featured && <div className="absolute top-5 right-5 bg-naranja text-white rounded-full px-3.5 py-1 text-[11px] font-bold tracking-wide uppercase">⭐ MÁS POPULAR</div>}
      <div className="text-[42px] mb-5">{icon}</div>
      <div className="font-heading text-[22px] font-extrabold text-negro mb-2 uppercase tracking-wide">{name}</div>
      <div className="text-sm text-gris leading-[1.6] mb-6">{desc}</div>
      <ul className="flex flex-col gap-2 mb-7 list-none">
        {includes.map((item) => (
          <li key={item} className="text-[13px] text-negro font-medium flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${featured ? 'bg-naranja' : 'bg-azul'}`} />{item}
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-2.5 mb-5">
        <div className="text-[15px] text-gris line-through">{oldPrice} MXN</div>
        <div className="font-heading text-[36px] font-extrabold text-azul leading-none">{newPrice} <small className="text-sm font-semibold text-gris">/ persona</small></div>
        <div className="bg-[#E8F8F0] text-verde rounded-full px-2.5 py-0.5 text-[11px] font-bold">{save}</div>
      </div>
      <button onClick={onAdd} className={`w-full py-3.5 rounded-full text-[15px] font-bold transition-all hover:-translate-y-px ${featured ? 'bg-naranja hover:bg-naranja-dark' : 'bg-azul hover:bg-azul-dark'} text-white`}>Agregar plan →</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TESTIMONIO CARD COMPONENT
══════════════════════════════════════════════════════════════ */
function TestimonioCard({ stars, text, name, city, initial, color }: {
  stars: number; text: string; name: string; city: string; initial: string; color: string;
}) {
  return (
    <div className="bg-white rounded-[20px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-black/[.05] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-shadow">
      <div className="text-naranja text-lg mb-3.5">{'★'.repeat(stars)}</div>
      <p className="text-[15px] leading-[1.75] text-negro mb-5 italic">{text}</p>
      <div className="flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0" style={{background: color}}>{initial}</div>
        <div>
          <div className="text-sm font-bold text-negro">{name}</div>
          <div className="text-xs text-gris">{city}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FOOTER COL COMPONENT
══════════════════════════════════════════════════════════════ */
function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[11px] tracking-[3px] uppercase text-white font-bold mb-4">{title}</div>
      <ul className="flex flex-col gap-2.5 list-none">
        {links.map(([href, label]) => (
          <li key={label}><a href={href} className="text-sm text-white/55 hover:text-naranja transition-colors">{label}</a></li>
        ))}
      </ul>
    </div>
  );
}
