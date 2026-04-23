import React, { useMemo } from 'react'

// DiffViewer — pure JS side-by-side diff renderer.
// Props:
//   oldCode: string
//   newCode: string

function computeDiff(oldLines, newLines) {
  // Simple LCS-based diff
  const m = oldLines.length, n = newLines.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = oldLines[i] === newLines[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])

  const result = []
  let i = 0, j = 0
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'equal', old: oldLines[i], new: newLines[j] })
      i++; j++
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: 'added', old: null, new: newLines[j] })
      j++
    } else {
      result.push({ type: 'removed', old: oldLines[i], new: null })
      i++
    }
  }
  return result
}

export default function DiffViewer({ oldCode = '', newCode = '' }) {
  const diff = useMemo(() => computeDiff(
    oldCode.split('\n'),
    newCode.split('\n')
  ), [oldCode, newCode])

  let oldLineNum = 0
  let newLineNum = 0

  return (
    <div className="font-mono text-xs overflow-auto max-h-full">
      <div className="grid grid-cols-2 divide-x divide-white/10 min-w-0">
        {/* Old side header */}
        <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/10">
          Before
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/10">
          After
        </div>

        {diff.map((chunk, idx) => {
          let oldNum = null, newNum = null
          if (chunk.type === 'equal') { oldLineNum++; newLineNum++; oldNum = oldLineNum; newNum = newLineNum }
          else if (chunk.type === 'removed') { oldLineNum++; oldNum = oldLineNum }
          else if (chunk.type === 'added') { newLineNum++; newNum = newLineNum }

          const oldBg = chunk.type === 'removed' ? 'bg-red-500/15' : chunk.type === 'equal' ? '' : 'bg-transparent'
          const newBg = chunk.type === 'added' ? 'bg-emerald-500/15' : chunk.type === 'equal' ? '' : 'bg-transparent'

          return (
            <React.Fragment key={idx}>
              {/* Old side */}
              <div className={`flex items-start gap-2 px-2 py-0.5 min-h-[22px] ${oldBg}`}>
                <span className="text-white/20 select-none w-6 text-right shrink-0">{oldNum}</span>
                {chunk.type === 'removed' && <span className="text-red-400 select-none shrink-0">−</span>}
                {chunk.type === 'equal' && <span className="text-white/10 select-none shrink-0"> </span>}
                <span className={`break-all leading-relaxed ${chunk.type === 'removed' ? 'text-red-300' : 'text-white/50'}`}>
                  {chunk.old ?? ''}
                </span>
              </div>

              {/* New side */}
              <div className={`flex items-start gap-2 px-2 py-0.5 min-h-[22px] ${newBg}`}>
                <span className="text-white/20 select-none w-6 text-right shrink-0">{newNum}</span>
                {chunk.type === 'added' && <span className="text-emerald-400 select-none shrink-0">+</span>}
                {chunk.type === 'equal' && <span className="text-white/10 select-none shrink-0"> </span>}
                <span className={`break-all leading-relaxed ${chunk.type === 'added' ? 'text-emerald-300' : 'text-white/50'}`}>
                  {chunk.new ?? ''}
                </span>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
