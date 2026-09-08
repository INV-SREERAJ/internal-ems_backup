export default function Pagination({
  pageNumber,
  totalPages,
  onPrevious,
  onNext,
  onPageClick,
}) {
  function getPageNumbers(current, total) {
    const delta = 1; // how many pages to show on each side of current
    const pages = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        pages.push(i);
      }
    }

    const withDots = [];
    let prev;
    for (const page of pages) {
      if (prev) {
        if (page - prev === 2) {
          withDots.push(prev + 1); // fill single gaps instead of "..."
        } else if (page - prev > 2) {
          withDots.push("...");
        }
      }
      withDots.push(page);
      prev = page;
    }

    return withDots;
  }

  return (
    <div className="mt-5 flex items-center justify-center gap-2 max-[767px]:flex-wrap">
      <button
        type="button"
        onClick={onPrevious}
        disabled={pageNumber === 1}
        className="px-4 py-[9px] bg-white text-blue-600 border border-slate-300 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed max-[767px]:px-3 max-[767px]:py-2"
      >
        ‹ Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers(pageNumber, totalPages).map((page, index) =>
          page === "..." ? (
            <span
              key={`dots-${index}`}
              className="min-w-5 inline-flex items-center justify-center text-slate-400 text-[13px]"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageClick(page)}
              className={`min-w-[34px] h-[34px] px-1.5 inline-flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 max-[767px]:px-3 max-[767px]:py-2${
                page === pageNumber
                  ? " !bg-blue-600 !text-white !border-blue-600"
                  : ""
              }`}
              aria-current={page === pageNumber ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={pageNumber === totalPages || totalPages === 0}
        className="px-4 py-[9px] bg-white text-blue-600 border border-slate-300 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed max-[767px]:px-3 max-[767px]:py-2"
      >
        Next ›
      </button>
    </div>
  );
}
