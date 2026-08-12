export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto flex max-w-[1240px] items-center justify-center px-4 py-5 lg:px-8">
        <a
          href="https://xmethod.de"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
        >
          <span
            className="text-xs tracking-wide"
            style={{ fontFamily: '"Lexend", Inter, system-ui, sans-serif' }}
          >
            Designed &amp; Developed by
          </span>
          <img
            src="/xmethod.svg"
            alt="XMETHOD"
            className="h-4 w-auto opacity-80 transition-opacity group-hover:opacity-100"
          />
        </a>
      </div>
    </footer>
  );
}
