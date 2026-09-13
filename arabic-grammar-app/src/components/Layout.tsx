import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useProgressStore } from '@/store/progressStore'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/study', label: "Today's Study" },
  { to: '/review', label: "Today's Review" },
  { to: '/curriculum', label: 'Curriculum' },
  { to: '/irab', label: 'Iʿrāb Practice' },
  { to: '/explain', label: 'Explain It Yourself' },
  { to: '/examples', label: 'Example Bank' },
  { to: '/progress', label: 'Progress' },
  { to: '/bookmarks', label: 'Difficult Topics' },
  { to: '/search', label: 'Search' },
  { to: '/settings', label: 'Settings' },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]/60'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const streak = useProgressStore((s) => s.streakDays)

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-paper)]/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          Menu
        </button>
        <span className="font-arabic text-lg">الآجرومية</span>
        <span className="text-xs text-[var(--color-ink-soft)]">🔥 {streak}d</span>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-[var(--color-paper)] p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-arabic text-xl">الآجرومية</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
              >
                ✕
              </button>
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 md:px-6 md:py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-8">
            <div className="mb-6 px-1">
              <p className="font-arabic text-2xl leading-tight">الآجرومية</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Study Companion</p>
            </div>
            <NavList />
            <div className="mt-6 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
              🔥 Streak: <span className="font-medium text-[var(--color-ink)]">{streak} day{streak === 1 ? '' : 's'}</span>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
