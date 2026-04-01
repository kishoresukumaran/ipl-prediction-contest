'use client';

interface CopycatData {
  copier: string;
  copierName: string;
  copierColor: string;
  target: string;
  targetName: string;
  targetColor: string;
  count: number;
  matches: number;
}

export function CopycatChart({ data }: { data: CopycatData[] }) {
  if (!data?.length) return (
    <div className="text-center py-8">
      <p className="text-slate-500 text-sm">No copycat patterns detected yet.</p>
      <p className="text-slate-600 text-xs mt-1">Need more matches with timestamps to find the copycats</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {data.map((pair, i) => (
        <div key={`${pair.copier}-${pair.target}`} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            i === 0 ? 'bg-purple-500 text-white' : i === 1 ? 'bg-purple-400 text-white' : i === 2 ? 'bg-purple-300 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {i + 1}
          </span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: pair.copierColor }}>
              {pair.copierName.charAt(0)}
            </div>
            <span className="text-sm text-white font-medium truncate">{pair.copierName}</span>
            <span className="text-slate-500 text-xs shrink-0">copies</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: pair.targetColor }}>
              {pair.targetName.charAt(0)}
            </div>
            <span className="text-sm text-white font-medium truncate">{pair.targetName}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-purple-400 text-sm font-bold">{pair.count}x</span>
            <span className="text-slate-500 text-[10px] ml-1">/ {pair.matches}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
