import React from 'react'
import { Button } from './Button'
import { PlusIcon } from '../icons/PlusIcon'
import { ShareIcon } from '../icons/ShareIcon'

interface TopbarProps {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void

  // Search
  searchQuery: string
  onChangeQuery: (value: string) => void
  searchType: 'normal' | 'secondbrain'
  onChangeSearchType: (type: 'normal' | 'secondbrain') => void
  onExecuteSearch: () => void

  // Actions
  onOpenAddContent?: () => void
  onOpenShare?: () => void
  onNavigateToBrain?: () => void
  onNavigateToDashboard?: () => void
  onNavigateToOthers?: () => void

  // Which page are we on to show a context button
  context?: 'dashboard' | 'brain'
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onChangeQuery,
  searchType,
  onChangeSearchType,
  onExecuteSearch,
  onOpenAddContent,
  onOpenShare,
  onNavigateToBrain,
  onNavigateToDashboard,
  onNavigateToOthers,
  context = 'dashboard'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      onExecuteSearch()
    }
  }

  return (
    <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70 border-b border-white/10">
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3">
        {/* Left: Sidebar toggle + Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <button
            onClick={context === 'dashboard' ? onNavigateToDashboard : onNavigateToBrain}
            className="text-white font-bold text-lg tracking-wide hover:text-indigo-300 transition-colors"
          >
            Second Brain
          </button>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-3xl mx-auto hidden sm:flex">
          <div className="relative flex-1">
            <input
              value={searchQuery}
              onChange={(e) => onChangeQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchType === 'normal' ? 'Search your content...' : 'Ask Second Brain...'}
              className="w-full pl-11 pr-28 py-2.5 text-sm bg-white/95 border border-white/20 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" stroke="currentColor" fill="none" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" stroke="currentColor" />
              </svg>
            </span>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
              >
                {searchType === 'normal' ? 'Normal' : 'Second Brain'}
              </button>
              <button
                onClick={onExecuteSearch}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
            {isDropdownOpen && (
              <div className="absolute right-2 mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-200 text-sm">
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${searchType === 'normal' ? 'font-semibold text-indigo-600' : ''}`}
                  onClick={() => {
                    onChangeSearchType('normal')
                    setIsDropdownOpen(false)
                  }}
                >
                  Normal Search
                </button>
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${searchType === 'secondbrain' ? 'font-semibold text-indigo-600' : ''}`}
                  onClick={() => {
                    onChangeSearchType('secondbrain')
                    setIsDropdownOpen(false)
                  }}
                >
                  Second Brain Search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Primary actions */}
        <div className="flex items-center gap-2">
          {onOpenAddContent && (
            <Button variant="primary" size="sm" text="Add" startIcon={<PlusIcon />} onClick={onOpenAddContent} />
          )}
          {onOpenShare && (
            <Button variant="secondary" size="sm" text="Share" startIcon={<ShareIcon />} onClick={onOpenShare} />
          )}
          {context === 'dashboard' && onNavigateToBrain && (
            <button onClick={onNavigateToBrain} className="px-3 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700">Brain</button>
          )}
          {context === 'dashboard' && onNavigateToOthers && (
            <button onClick={onNavigateToOthers} className="px-3 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700">Others</button>
          )}
          {context === 'brain' && onNavigateToDashboard && (
            <button onClick={onNavigateToDashboard} className="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">Dashboard</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Topbar
