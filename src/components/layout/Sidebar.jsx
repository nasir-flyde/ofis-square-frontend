import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { 
  Home, 
  Users, 
  Building, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Settings, 
  LogOut,
  FileSignature,
  BarChart3,
  Ticket,
  CreditCard,
  QrCode,
  UserCheck
} from "lucide-react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveToken } = useApi();

  const handleLogout = () => {
    // Clear auth token and user info
    try {
      saveToken("");
    } catch {}
    localStorage.removeItem("user");
    // Navigate to auth page
    navigate("/auth");
  };

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: <Home size={20} />, 
      path: "/dashboard" 
    },
    { 
      id: "reception", 
      label: "Reception", 
      icon: <QrCode size={20} />, 
      path: "/visitors/reception" 
    },

    { 
      id: "clients", 
      label: "Clients", 
      icon: <Users size={20} />, 
      path: "/clients" 
    },
    // { 
    //   id: "members", 
    //   label: "Members", 
    //   icon: <UserCheck size={20} />, 
    //   path: "/members" 
    // },
    { 
      id: "cabins", 
      label: "Cabins", 
      icon: <Building size={20} />, 
      path: "/cabins" 
    },
    { 
      id: "meeting-rooms", 
      label: "Meeting Rooms", 
      icon: <Calendar size={20} />, 
      path: "/meeting-rooms" 
    },

    { 
      id: "buildings", 
      label: "Buildings", 
      icon: <Building2 size={20} />, 
      path: "/buildings" 
    },
    { 
      id: "invoices", 
      label: "Invoices", 
      icon: <FileText size={20} />, 
      path: "/invoices" 
    },
    { 
      id: "payments", 
      label: "Payments", 
      icon: <CreditCard size={20} />, 
      path: "/payments" 
    },
    { 
      id: "contracts", 
      label: "Contracts", 
      icon: <FileSignature size={20} />, 
      path: "/contracts" 
    },
    { 
      id: "tickets", 
      label: "Tickets", 
      icon: <Ticket size={20} />, 
      path: "/tickets" 
    },
    { 
      id: "users", 
      label: "Users", 
      icon: <User size={20} />, 
      path: "/users" 
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: <Settings size={20} />, 
      path: "/settings" 
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: <BarChart3 size={20} />, 
      path: "/reports" 
    }
  ];

  const handleNavigation = (path, id) => {
    if (id === "logout") {
      handleLogout();
      return;
    }
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="https://cdn-ildohoj.nitrocdn.com/AHrVgCXyQAsLJyFSAzWCDlVPIrrckAMO/assets/images/optimized/rev-f2f5723/ofissquare.com/wp-content/uploads/2025/02/logo-2-300x46.png" 
            alt="Ofis Square" 
            className="h-8 w-auto object-contain"
            onError={(e) => {
              // Graceful fallback to colored square if image not found
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('sidebar-logo-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div id="sidebar-logo-fallback" className="hidden w-8 h-8 bg-gray-800 rounded" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigation(item.path, item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors">
          <span className="text-lg"><LogOut size={20} /></span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
