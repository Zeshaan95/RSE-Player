import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useEnsureReviewItems } from '@/hooks/useEnsureReviewItems'
import { useApplyTheme } from '@/hooks/useApplyTheme'
import { DashboardPage } from '@/pages/DashboardPage'
import { CurriculumPage } from '@/pages/CurriculumPage'
import { LessonPage } from '@/pages/LessonPage'
import { MemorisationPage } from '@/pages/MemorisationPage'
import { RecallPracticePage } from '@/pages/RecallPracticePage'
import { IrabHubPage } from '@/pages/IrabHubPage'
import { IrabPracticePage } from '@/pages/IrabPracticePage'
import { ExplainHubPage } from '@/pages/ExplainHubPage'
import { ExplainPracticePage } from '@/pages/ExplainPracticePage'
import { ExampleBankPage } from '@/pages/ExampleBankPage'
import { TodaysReviewPage } from '@/pages/TodaysReviewPage'
import { StudySessionPage } from '@/pages/StudySessionPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { SearchPage } from '@/pages/SearchPage'
import { BookmarksPage } from '@/pages/BookmarksPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  useEnsureReviewItems()
  useApplyTheme()
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/lesson/:lessonId/memorise" element={<MemorisationPage />} />
          <Route path="/lesson/:lessonId/recall" element={<RecallPracticePage />} />
          <Route path="/irab" element={<IrabHubPage />} />
          <Route path="/irab/:level" element={<IrabPracticePage />} />
          <Route path="/explain" element={<ExplainHubPage />} />
          <Route path="/explain/:lessonId" element={<ExplainPracticePage />} />
          <Route path="/examples" element={<ExampleBankPage />} />
          <Route path="/review" element={<TodaysReviewPage />} />
          <Route path="/study" element={<StudySessionPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
