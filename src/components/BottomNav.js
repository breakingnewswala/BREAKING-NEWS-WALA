import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Home, Newspaper, PenSquare, Search, User } from 'lucide-react';
export const BottomNav = ({ activeTab, onTabChange, currentRole, pendingQueueCount = 0, }) => {
    const getDeskLabel = () => {
        switch (currentRole) {
            case 'ADMIN':
                return 'न्यूज़रूम';
            case 'REPORTER':
                return 'रिपोर्टर';
            default:
                return 'प्रेस डेस्क';
        }
    };
    const navItems = [
        {
            id: 'home',
            label: 'होम',
            icon: _jsx(Home, { className: "w-5 h-5" }),
        },
        {
            id: 'epaper',
            label: 'ई-पेपर',
            icon: _jsx(Newspaper, { className: "w-5 h-5" }),
        },
        {
            id: 'desk',
            label: getDeskLabel(),
            icon: _jsx(PenSquare, { className: "w-5 h-5" }),
            badge: currentRole === 'ADMIN' && pendingQueueCount > 0 ? pendingQueueCount : undefined,
        },
        {
            id: 'search',
            label: 'खोजें',
            icon: _jsx(Search, { className: "w-5 h-5" }),
        },
        {
            id: 'profile',
            label: 'प्रोफ़ाइल',
            icon: _jsx(User, { className: "w-5 h-5" }),
        },
    ];
    return (_jsx("nav", { className: "block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg", children: _jsx("div", { className: "max-w-md mx-auto grid grid-cols-5 h-14", children: navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (_jsxs("button", { onClick: () => onTabChange(item.id), className: `flex flex-col items-center justify-center relative transition-colors ${isActive ? 'text-[#ED1727]' : 'text-slate-500 hover:text-slate-800'}`, children: [_jsxs("div", { className: "relative", children: [item.icon, item.badge !== undefined && item.badge > 0 && (_jsx("span", { className: "absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center", children: item.badge }))] }), _jsx("span", { className: `text-[11px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`, children: item.label }), isActive && (_jsx("div", { className: "absolute top-0 w-8 h-[2px] bg-[#ED1727] rounded-full" }))] }, item.id));
            }) }) }));
};
