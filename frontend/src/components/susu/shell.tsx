// Measure the stable panel, not the header that slides away on scroll.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import { useLocation, useNavigate } from "@/components/navigation";
import { Icon, type IconName } from "./icon";
import { SettingsPanel } from "./settings";
import { WorkspaceSearch } from "./search";
const navigationItems = [
  { name: "Calendario", icon: "calendar" as IconName, path: "/calendario" },
  { name: "Notas", icon: "note" as IconName, path: "/notas" },
  { name: "Asistente", icon: "sparkle" as IconName, path: "/asistente" },
];

export function AppHeader({
  showBack = false,
  isHidden = false,
}: {
  showBack?: boolean;
  isHidden?: boolean;
}) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [toolbarFrame, setToolbarFrame] = useState<{
    left: number;
    top: number;
    width: number;
    scale: number;
  } | null>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const panel = header?.parentElement;
    const content = panel?.querySelector<HTMLElement>(".app-screen-content");
    if (!header || !panel || !content) return;
    const updateFrame = () => {
      const bounds = panel.getBoundingClientRect();
      const scale = bounds.width / panel.offsetWidth;
      setToolbarFrame({
        left: bounds.left + panel.clientLeft * scale,
        top: bounds.top + panel.clientTop * scale,
        width: header.offsetWidth,
        scale,
      });
    };
    updateFrame();
    const resizeObserver = new ResizeObserver(updateFrame);
    resizeObserver.observe(panel);
    resizeObserver.observe(content);
    const sizeObserver = new MutationObserver(updateFrame);
    sizeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-interface-size"],
    });
    window.addEventListener("resize", updateFrame);
    return () => {
      resizeObserver.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener("resize", updateFrame);
    };
  }, []);
  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [settingsOpen]);
  const openSettings = () => {
    setSettingsClosing(false);
    setSettingsOpen(true);
  };
  const closeSettings = () => {
    if (settingsClosing) return;
    setSettingsClosing(true);
    window.setTimeout(() => {
      setSettingsOpen(false);
      setSettingsClosing(false);
    }, 240);
  };
  const navigateHomeWithTransition = () => {
    const transitionDocument = document as Document & {
      startViewTransition?: (update: () => void) => { finished: Promise<void> };
    };
    if (
      !transitionDocument.startViewTransition ||
      document.documentElement.dataset.reduceMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      navigate("/");
      return;
    }

    document.documentElement.dataset.routeTransition = "home";
    const transition = transitionDocument.startViewTransition(() => {
      flushSync(() => navigate("/"));
    });
    transition.finished.finally(() => delete document.documentElement.dataset.routeTransition);
  };
  return (
    <>
      <header
        ref={headerRef}
        data-hidden={isHidden}
        aria-hidden="true"
        className={`app-header-banner absolute inset-x-0 top-0 z-20 h-[78px] border-b border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] transition-transform duration-300 ease-out ${
          isHidden ? "-translate-y-full pointer-events-none" : "translate-y-0"
        }`}
      />
      {toolbarFrame &&
        createPortal(
          <div
            className={`app-toolbar route-static-header pointer-events-none fixed z-20 flex h-[78px] origin-top-left items-center justify-between px-6 sm:px-10 lg:px-14 ${
              isHidden ? "is-floating" : ""
            }`}
            style={{
              left: toolbarFrame.left,
              top: toolbarFrame.top,
              width: toolbarFrame.width,
              transform: `scale(${toolbarFrame.scale})`,
            }}
          >
            {showBack ? (
              <button
                onClick={navigateHomeWithTransition}
                className="toolbar-home pointer-events-auto flex items-center gap-2 rounded-full px-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[var(--ui-surface)]/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)] lg:gap-3 lg:bg-[var(--ui-action)] lg:px-5 lg:py-3 lg:text-[var(--ui-surface)] lg:shadow-[0_4px_12px_rgba(32,33,31,0.16)] lg:hover:bg-[var(--ui-panel-hover)]"
                aria-label="Ir a Inicio"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--ui-ink)]/35 lg:border-[var(--ui-surface)]/35">
                  <Icon name="home" size={16} />
                </span>
                <span className="lg:hidden">Inicio</span>
                <span className="hidden lg:inline">Volver a Inicio</span>
              </button>
            ) : (
              <span
                className={
                  isHidden
                    ? "invisible"
                    : "font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em] sm:text-[28px]"
                }
              >
                Inicio
              </span>
            )}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => setSearchOpen((open) => !open)}
                aria-expanded={searchOpen}
                className="toolbar-action grid h-10 w-10 place-items-center rounded-full border border-transparent transition hover:border-[var(--ui-ink)] focus-visible:border-[var(--ui-ink)] focus-visible:outline-none"
                aria-label="Buscar"
              >
                <Icon name="search" />
              </button>
              <button
                onClick={openSettings}
                className="toolbar-action grid h-10 w-10 place-items-center rounded-full border border-transparent transition hover:bg-[var(--ui-action)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)]"
                aria-label="Abrir ajustes"
              >
                <Icon name="menu" />
              </button>
            </div>
            {searchOpen && <WorkspaceSearch onClose={() => setSearchOpen(false)} />}
          </div>,
          document.body,
        )}
      {settingsOpen && <SettingsPanel isClosing={settingsClosing} onClose={closeSettings} />}
    </>
  );
}

export function useMobileHeaderVisibility() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollTop = useRef(0);
  const accumulatedScroll = useRef(0);
  const isHiddenRef = useRef(false);
  const updateVisibility = (nextScrollTop: number) => {
    const delta = nextScrollTop - lastScrollTop.current;
    if (nextScrollTop < 12) {
      accumulatedScroll.current = 0;
      if (isHiddenRef.current) {
        isHiddenRef.current = false;
        setIsHidden(false);
      }
      lastScrollTop.current = nextScrollTop;
      return;
    }

    if (delta === 0) return;
    const movingDown = delta > 0;
    accumulatedScroll.current =
      Math.sign(accumulatedScroll.current) === Math.sign(delta)
        ? accumulatedScroll.current + delta
        : delta;

    if (movingDown && accumulatedScroll.current >= 28 && !isHiddenRef.current) {
      isHiddenRef.current = true;
      setIsHidden(true);
      accumulatedScroll.current = 0;
    } else if (!movingDown && accumulatedScroll.current <= -48 && isHiddenRef.current) {
      isHiddenRef.current = false;
      setIsHidden(false);
      accumulatedScroll.current = 0;
    }

    lastScrollTop.current = nextScrollTop;
  };
  const onScroll = (event: UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    updateVisibility(Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight)));
  };
  return { isHidden, onScroll };
}

export function FloatingNavigation({ active }: { active?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = navigationItems.findIndex((item) => item.path === location.pathname);
  const navigateWithSlide = (path: string) => {
    const nextIndex = navigationItems.findIndex((item) => item.path === path);
    if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) {
      navigate(path);
      return;
    }

    const direction = nextIndex > currentIndex ? "forward" : "backward";
    const transitionDocument = document as Document & {
      startViewTransition?: (update: () => void) => { finished: Promise<void> };
    };

    if (
      !transitionDocument.startViewTransition ||
      document.documentElement.dataset.reduceMotion === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      navigate(path);
      return;
    }

    document.documentElement.dataset.routeTransition = direction;
    const transition = transitionDocument.startViewTransition(() => {
      flushSync(() => navigate(path));
    });
    transition.finished.finally(() => delete document.documentElement.dataset.routeTransition);
  };

  return createPortal(
    <nav
      aria-label="Navegación principal"
      className="floating-scale floating-navigation-elevated route-static-navigation fixed bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[var(--ui-ink)]/15 bg-[var(--ui-surface)]/85 p-2 shadow-[0_8px_26px_rgba(32,33,31,0.16)] backdrop-blur-xl lg:bottom-14 lg:p-2.5"
    >
      <div className="flex items-center gap-2 lg:gap-3">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigateWithSlide(item.path)}
            aria-current={active === item.name ? "page" : undefined}
            className={`group flex min-w-[88px] flex-col items-center justify-center gap-1 rounded-full border px-3 py-2.5 backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ink)] sm:min-w-[118px] sm:flex-row sm:gap-2 lg:min-w-[205px] lg:px-9 lg:py-5 lg:gap-3 ${
              active === item.name
                ? "border-[var(--ui-ink)] bg-[var(--ui-action)] text-[var(--ui-surface)]"
                : "border-[var(--ui-ink)]/15 bg-[var(--ui-surface)]/80 hover:border-[var(--ui-ink)]/45 hover:bg-[var(--ui-panel-hover)]"
            }`}
          >
            <span className="grid h-7 w-7 place-items-center lg:h-8 lg:w-8 lg:scale-[1.24]">
              <Icon name={item.icon} size={17} />
            </span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.07em] lg:text-[11px] lg:tracking-[0.06em]">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </nav>,
    document.body,
  );
}

export function SecondaryScreen({ active, children }: { active: string; children: ReactNode }) {
  const { isHidden, onScroll } = useMobileHeaderVisibility();
  return (
    <div className="app-screen-layout min-h-screen bg-[var(--ui-page)] p-0 text-[var(--ui-ink)] selection:bg-[var(--ui-accent)] lg:p-7">
      <div className="relative mx-auto flex h-[100dvh] min-h-screen max-w-[1440px] flex-col overflow-hidden bg-[var(--ui-surface)] shadow-[0_14px_45px_rgba(32,33,31,0.10)] lg:h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:border lg:border-[var(--ui-ink)]/20">
        <AppHeader showBack isHidden={isHidden} />
        <main
          onScroll={onScroll}
          className={`app-screen-content mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-9 pb-52 sm:px-10 sm:pt-12 sm:pb-52 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-14 lg:py-14`}
        >
          {children}
        </main>
      </div>
      <FloatingNavigation active={active} />
    </div>
  );
}

export function WelcomeTour({ onComplete }: { onComplete: () => void }) {
  const [slide, setSlide] = useState(0);
  const slides: {
    icon: IconName;
    label: string;
    title: string;
    description: string;
    highlights: string[];
  }[] = [
    {
      icon: "home",
      label: "01 · Proyectos",
      title: "Todo empieza con un proyecto.",
      description:
        "Reúne el contexto, el progreso y las próximas acciones de cada entrega en un solo lugar.",
      highlights: ["Crea espacios de trabajo", "Consulta el progreso", "Prioriza lo que sigue"],
    },
    {
      icon: "calendar",
      label: "02 · Calendario",
      title: "Convierte fechas en un plan claro.",
      description:
        "Visualiza entregas y tareas por día para anticiparte a los momentos importantes del semestre.",
      highlights: ["Revisa entregas", "Elige cualquier día", "Añade tareas puntuales"],
    },
    {
      icon: "note",
      label: "03 · Notas",
      title: "Guarda las ideas mientras ocurren.",
      description:
        "Centraliza referencias, hallazgos y borradores; después asócialos con el proyecto que corresponda.",
      highlights: ["Crea notas rápidas", "Vincúlalas a proyectos", "Edita cuando lo necesites"],
    },
    {
      icon: "sparkle",
      label: "04 · Asistente",
      title: "Desbloquea el siguiente paso.",
      description:
        "Prepara una solicitud con el contexto de tu proyecto. No se envía información a servicios externos.",
      highlights: ["Selecciona tu proyecto", "Revisa el contexto", "Copia tu solicitud"],
    },
  ];
  const current = slides[slide];
  const isLastSlide = slide === slides.length - 1;

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onComplete();
      }}
      className="fixed inset-0 z-[90] grid place-items-end bg-[var(--ui-action)]/30 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
    >
      <section className="w-full max-w-[860px] overflow-hidden rounded-[30px] border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] shadow-[0_24px_80px_var(--ui-elevation)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-[var(--ui-panel)] p-7 sm:p-10">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-[var(--ui-ink)]/20 bg-[var(--ui-surface)]/20" />
            <div className="relative">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] text-[var(--ui-action)]">
                <Icon name={current.icon} size={27} />
              </span>
              <p className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-muted)]">
                {current.label}
              </p>
              <h2
                id="welcome-tour-title"
                className="mt-3 max-w-[330px] font-[family-name:var(--font-display)] text-4xl leading-[0.95] tracking-[-0.055em] sm:text-5xl"
              >
                {current.title}
              </h2>
              <div className="mt-8 rounded-2xl border border-[var(--ui-ink)]/20 bg-[var(--ui-surface)]/75 p-4 shadow-[0_12px_28px_var(--ui-elevation)]">
                <div className="flex items-center justify-between border-b border-[var(--ui-ink)]/15 pb-3">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-muted)]">
                    Vista de {current.label.split("· ")[1]}
                  </span>
                  <Icon name={current.icon} size={16} />
                </div>
                <div className="mt-4 space-y-2">
                  {current.highlights.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-[var(--ui-ink)]/15 bg-[var(--ui-project-card)]/70 px-3 py-2.5"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--ui-ink)]/25 font-mono text-[9px]">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex min-h-[380px] flex-col p-7 sm:p-10">
            <button
              type="button"
              onClick={onComplete}
              className="self-end font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ui-muted)] underline underline-offset-4"
            >
              Omitir introducción
            </button>
            <div className="my-auto py-9">
              <p className="max-w-[410px] text-lg leading-8 text-[var(--ui-muted)]">
                {current.description}
              </p>
              <div className="mt-8 border-y border-[var(--ui-ink)]/15">
                {current.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3 py-3 text-sm">
                    <span className="h-2 w-2 rounded-full bg-[var(--ui-action)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2" aria-label={`Paso ${slide + 1} de ${slides.length}`}>
                {slides.map((item, index) => (
                  <span
                    key={item.label}
                    className={`h-2 rounded-full transition-all ${
                      index === slide ? "w-8 bg-[var(--ui-action)]" : "w-2 bg-[var(--ui-ink)]/25"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSlide((currentSlide) => Math.max(0, currentSlide - 1))}
                  disabled={slide === 0}
                  className="rounded-full border border-[var(--ui-ink)]/25 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] transition disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    isLastSlide ? onComplete() : setSlide((currentSlide) => currentSlide + 1)
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-action)] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--ui-surface)] transition hover:bg-[var(--ui-panel-hover)]"
                >
                  {isLastSlide ? "Empezar a planificar" : "Siguiente"}
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
