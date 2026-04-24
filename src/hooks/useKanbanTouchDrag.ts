import React, { useRef, useCallback } from 'react';

export interface TouchDragCallbacks {
  onDragStart: (leadId: string, phase: string) => void;
  onDragEnd: (leadId: string, fromPhase: string, toPhase: string | null, toIndex: number | null) => void;
  onColumnHover: (phase: string | null, index: number | null) => void;
}

export interface TouchDragState {
  isDragging: boolean;
  draggingLeadId: string | null;
  hoveredPhase: string | null;
  hoveredIndex: number | null;
}

export function useKanbanTouchDrag(
  kanbanScrollRef: React.RefObject<HTMLDivElement>,
  callbacks: TouchDragCallbacks
) {
  const draggingLeadId   = useRef<string | null>(null);
  const draggingPhase    = useRef<string | null>(null);
  const hoveredPhase     = useRef<string | null>(null);
  const hoveredIndex     = useRef<number | null>(null);
  const ghostEl          = useRef<HTMLElement | null>(null);
  const scrollRaf        = useRef<number | null>(null);
  const startX           = useRef(0);
  const startY           = useRef(0);
  const hasMoved         = useRef(false);
  const touchId          = useRef<number | null>(null);

  const createGhost = useCallback((sourceEl: HTMLElement, clientX: number, clientY: number) => {
    const rect = sourceEl.getBoundingClientRect();
    const clone = sourceEl.cloneNode(true) as HTMLElement;

    clone.classList.add('pointer-events-none', 'select-none');

    clone.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      z-index: 9999;
      pointer-events: none;
      border-radius: 16px;
      box-shadow: 0 30px 90px rgba(0,0,0,0.30);
      opacity: 0.98;
      transform: scale(1.05) rotate(1deg);
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
      will-change: transform, left, top;
      touch-action: none;
      user-select: none;
      filter: saturate(1.1) brightness(1.02);
      backdrop-filter: blur(4px);
    `;

    clone.dataset.offsetX = String(clientX - rect.left);
    clone.dataset.offsetY = String(clientY - rect.top);

    document.body.appendChild(clone);
    ghostEl.current = clone;

    if ('vibrate' in navigator) navigator.vibrate(10);
  }, []);

  const removeGhost = useCallback(() => {
    if (ghostEl.current) {
      ghostEl.current.style.transition = 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease';
      ghostEl.current.style.transform  = 'scale(0.9) rotate(0deg)';
      ghostEl.current.style.opacity    = '0';
      const el = ghostEl.current;
      setTimeout(() => el.remove(), 210);
      ghostEl.current = null;
    }
  }, []);

  const moveGhost = useCallback((clientX: number, clientY: number) => {
    const g = ghostEl.current;
    if (!g) return;
    const ox = Number(g.dataset.offsetX) || 0;
    const oy = Number(g.dataset.offsetY) || 0;
    g.style.left = `${clientX - ox}px`;
    g.style.top  = `${clientY - oy}px`;
  }, []);

  const startAutoScroll = useCallback((clientX: number) => {
    const container = kanbanScrollRef.current;
    if (!container) return;

    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);

    const tick = () => {
      const g = ghostEl.current;
      if (!g) { scrollRaf.current = null; return; }

      const rect = container.getBoundingClientRect();
      const edgeSize = 100;
      const relX = clientX - rect.left;

      if (relX < edgeSize) {
        const intensity = (edgeSize - relX) / edgeSize;
        container.scrollLeft -= Math.ceil(24 * intensity);
      } else if (relX > rect.width - edgeSize) {
        const intensity = (relX - (rect.width - edgeSize)) / edgeSize;
        container.scrollLeft += Math.ceil(24 * intensity);
      }

      scrollRaf.current = requestAnimationFrame(tick);
    };

    scrollRaf.current = requestAnimationFrame(tick);
  }, [kanbanScrollRef]);

  const stopAutoScroll = useCallback(() => {
    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = null;
    }
  }, []);

  const detectTarget = useCallback((clientX: number, clientY: number) => {
    const g = ghostEl.current;
    if (g) g.style.visibility = 'hidden';

    const elUnder = document.elementFromPoint(clientX, clientY);

    if (g) g.style.visibility = 'visible';

    if (!elUnder) return { phase: null, index: null };

    const col = (elUnder as HTMLElement).closest('[data-phase]') as HTMLElement | null;
    const phase = col?.dataset.phase ?? null;

    if (!phase || !col) return { phase, index: null };

    const cardContainer = col.querySelector('.group\\/droppable') as HTMLElement | null;
    if (!cardContainer) return { phase, index: 0 };

    const cards = Array.from(cardContainer.querySelectorAll('.group')) as HTMLElement[];
    let indexFound = cards.length;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (card.classList.contains('kanban-card-touch-source')) continue;

        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (clientY < midpoint) {
            indexFound = i;
            break;
        }
    }

    return { phase, index: indexFound };
  }, []);

  const setColumnHighlight = useCallback((phase: string | null, index: number | null) => {
    document.querySelectorAll('[data-phase]').forEach(el => {
      (el as HTMLElement).classList.remove('kanban-touch-over');
    });

    if (phase) {
      const col = document.querySelector(`[data-phase="${phase}"]`) as HTMLElement | null;
      col?.classList.add('kanban-touch-over');
    }

    hoveredPhase.current = phase;
    hoveredIndex.current = index;
    callbacks.onColumnHover(phase, index);
  }, [callbacks]);

  const onTouchStart = useCallback((
    e: React.TouchEvent<HTMLElement>,
    leadId: string,
    phase: string
  ) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchId.current   = touch.identifier;
    startX.current    = touch.clientX;
    startY.current    = touch.clientY;
    hasMoved.current  = false;
    draggingLeadId.current = leadId;
    draggingPhase.current  = phase;
  }, []);

  const onTouchMove = useCallback((
    e: React.TouchEvent<HTMLElement>
  ) => {
    const touch = (Array.from(e.touches) as Touch[]).find(t => t.identifier === touchId.current);
    if (!touch || !draggingLeadId.current) return;

    const dx = Math.abs(touch.clientX - startX.current);
    const dy = Math.abs(touch.clientY - startY.current);

    if (!hasMoved.current && (dx < 6 && dy < 6)) return;

    if (e.cancelable) e.preventDefault();

    if (!hasMoved.current) {
      hasMoved.current = true;
      const cardEl = (e.currentTarget as HTMLElement);
      createGhost(cardEl, startX.current, startY.current);
      callbacks.onDragStart(draggingLeadId.current, draggingPhase.current!);
    }

    moveGhost(touch.clientX, touch.clientY);
    startAutoScroll(touch.clientX);

    const { phase, index } = detectTarget(touch.clientX, touch.clientY);
    if (phase !== hoveredPhase.current || index !== hoveredIndex.current) {
      setColumnHighlight(phase, index);
    }
  }, [callbacks, createGhost, detectTarget, moveGhost, setColumnHighlight, startAutoScroll]);

  const onTouchEnd = useCallback((
    _e: React.TouchEvent<HTMLElement>
  ) => {
    stopAutoScroll();
    setColumnHighlight(null, null);
    removeGhost();

    const targetPhase = hoveredPhase.current;
    const targetIndex = hoveredIndex.current;
    const leadId = draggingLeadId.current;
    const fromPhase = draggingPhase.current;

    draggingLeadId.current = null;
    draggingPhase.current  = null;
    hoveredPhase.current   = null;
    hoveredIndex.current   = null;
    hasMoved.current       = false;
    touchId.current        = null;

    if (leadId && fromPhase !== null) {
      callbacks.onDragEnd(leadId, fromPhase, targetPhase, targetIndex);
    }
  }, [callbacks, removeGhost, setColumnHighlight, stopAutoScroll]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
