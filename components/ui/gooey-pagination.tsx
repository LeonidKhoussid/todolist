"use client";

import { useEffect, useId, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GooeyPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

// The SVG filter and sliding indicator are adapted from Ruixen UI's Gooey Pagination (MIT).
export function GooeyPagination({ currentPage, totalPages, onPageChange }: GooeyPaginationProps) {
  const filterId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentButtonRef = useRef<HTMLButtonElement>(null);
  const pages = Array.from({ length: totalPages }, (_unused, index) => index + 1);

  useEffect(() => {
    const viewport = scrollRef.current;
    const button = currentButtonRef.current;
    if (!viewport || !button) return;

    const buttonStart = button.offsetLeft;
    const buttonEnd = buttonStart + button.offsetWidth;
    const viewportStart = viewport.scrollLeft;
    const viewportEnd = viewportStart + viewport.clientWidth;
    if (buttonStart >= viewportStart && buttonEnd <= viewportEnd) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({
      left: buttonStart < viewportStart ? buttonStart : buttonEnd - viewport.clientWidth,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }, [currentPage, totalPages]);

  return (
    <nav className="task-pagination" aria-label="Страницы задач">
      <div className="gooey-pagination">
        <button
          className="gooey-arrow"
          type="button"
          aria-label="Предыдущая страница"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>

        <div className="gooey-scroll" ref={scrollRef}>
          <div className="gooey-track">
            <svg className="gooey-filter" aria-hidden="true" width="0" height="0">
              <defs>
                <filter id={filterId} x="-10%" y="-50%" width="120%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
            </svg>

            <div className="gooey-dots" style={{ filter: `url("#${filterId}")` }} aria-hidden="true">
              {pages.map((page) => <span className="gooey-dot" key={page} />)}
              <span
                className="gooey-current-dot"
                style={{ transform: `translate(calc(var(--page-step) * ${currentPage - 1}), -50%)` }}
              />
            </div>

            {pages.map((page) => (
              <button
                className="gooey-page-button"
                key={page}
                type="button"
                ref={page === currentPage ? currentButtonRef : undefined}
                aria-label={`Страница ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page)}
              />
            ))}
          </div>
        </div>

        <button
          className="gooey-arrow"
          type="button"
          aria-label="Следующая страница"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>

      <p className="pagination-count" role="status">
        <span aria-hidden="true">{currentPage} / {totalPages}</span>
        <span className="visually-hidden">Страница {currentPage} из {totalPages}</span>
      </p>
    </nav>
  );
}
