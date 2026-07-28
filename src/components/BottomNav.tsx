import React from 'react';
import { LayoutDashboard, Send, Radio, History, User } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'remit' | 'nearby' | 'activity' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingOfflineCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingOfflineCount
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
    { id: 'remit' as ActiveTab, label: 'Send', icon: Send },
    { id: 'nearby' as ActiveTab, label: 'Offline Pay', icon: Radio, badge: pendingOfflineCount, highlight: true },
    { id: 'activity' as ActiveTab, label: 'History', icon: History },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 text-slate-500 max-w-md mx-auto shadow-lg">
      <div className="grid grid-cols-5 items-center justify-items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-all ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.highlight ? (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                )}

                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[10px] mt-1 tracking-tight text-center ${
                isActive ? 'text-indigo-600 font-extrabold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


