# al-Ājurrūmiyyah Study Companion

A study companion for memorising, understanding, and applying **al-Ājurrūmiyyah**
(الآجرومية), the classical primer of Arabic grammar - built around active
recall, spaced repetition, and practical iʿrāb (إعراب), rather than passive
reading.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Zustand (with a localStorage-backed persistence layer, structured so a
  real backend can be swapped in later without rewriting the app or stores)
- Vitest + Testing Library

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the test suite once
npm run build    # typecheck + production build
```

All study data (progress, spaced-repetition schedules, bookmarks, settings,
session history) is stored locally in the browser - the app works fully
offline with no backend.

## Content architecture

Curriculum content lives entirely under `/content/chapters/*.json`, separate
from application code, and is loaded automatically via `import.meta.glob` in
`src/lib/content.ts` - add a new `chapter-NN.json` file and it appears in the
app with no code changes. Each file follows the `Chapter`/`Lesson` schema
defined in `src/types/content.ts`.

The first five chapters contain genuine excerpts of the matn of
al-Ājurrūmiyyah (a public-domain classical text). Two further chapters are
included as clearly-marked placeholders (`isPlaceholder: true`) to
demonstrate the intended curriculum shape (المفعول الذي لم يسم فاعله,
المبتدأ والخبر) without presenting invented text as the original matn -
replace their `matnArabic`/`translation` fields with verified text from a
reliable printed edition to activate them.

## Key modules

- `src/lib/srs.ts` - the spaced-repetition scheduling algorithm
- `src/lib/reviewQueue.ts` - builds a manageable "Today's Review" session out
  of everything currently due
- `src/store/*` - Zustand stores for review items (SRS state), aggregate
  progress, bookmarks, settings, and study sessions, all persisted
- `src/pages/*` - one page per learning mode (Dashboard, Curriculum, Lesson,
  Memorisation, Recall Practice, Iʿrāb Practice, Explain It Yourself,
  Example Bank, Today's Review, Daily Study Session, Progress, Search,
  Bookmarks, Settings)
