'use client';

export default function BrowserMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Browser Frame */}
      <div className="bg-white rounded-[20px] md:rounded-[28px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-black/5">
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#F8F8F8] border-b border-black/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-md px-4 py-1 text-xs text-[#0A0908]/50 border border-black/5 min-w-[200px] text-center">
              app.seedor.com
            </div>
          </div>
          <div className="w-[52px]"></div>
        </div>

        {/* Dashboard Content Placeholder */}
        <div className="aspect-[16/10] bg-gradient-to-br from-[#F8F9FA] to-[#E9ECEF] p-4 md:p-6">
          {/* Mock Dashboard */}
          <div className="h-full flex flex-col gap-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D9251C]/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-[#D9251C]/30"></div>
                </div>
                <div className="h-3 w-24 bg-black/10 rounded-full"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-white rounded-lg shadow-sm"></div>
                <div className="h-8 w-8 bg-white rounded-lg shadow-sm"></div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              {/* Sidebar */}
              <div className="col-span-1 bg-white rounded-xl p-3 shadow-sm hidden md:block">
                <div className="space-y-3">
                  <div className="h-8 w-full bg-[#D9251C]/10 rounded-lg"></div>
                  <div className="h-6 w-3/4 bg-black/5 rounded-lg"></div>
                  <div className="h-6 w-full bg-black/5 rounded-lg"></div>
                  <div className="h-6 w-2/3 bg-black/5 rounded-lg"></div>
                  <div className="h-6 w-full bg-black/5 rounded-lg"></div>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-span-3 md:col-span-2 flex flex-col gap-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="h-2 w-12 bg-black/10 rounded-full mb-2"></div>
                    <div className="h-5 w-16 bg-[#D9251C]/20 rounded"></div>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="h-2 w-10 bg-black/10 rounded-full mb-2"></div>
                    <div className="h-5 w-14 bg-green-500/20 rounded"></div>
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="h-2 w-14 bg-black/10 rounded-full mb-2"></div>
                    <div className="h-5 w-12 bg-blue-500/20 rounded"></div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                  <div className="h-3 w-24 bg-black/10 rounded-full mb-4"></div>
                  <div className="h-full flex items-end gap-2 pb-4">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 70].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#D9251C]/30 to-[#D9251C]/10 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
