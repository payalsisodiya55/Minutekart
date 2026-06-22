export const dudhwalaAdminSidebarMenu = [
  {
    type: "link",
    label: "Dashboard",
    path: "/admin/dudhwala",
    icon: "LayoutDashboard",
  },
  {
    type: "section",
    label: "OPERATIONS",
    items: [
      {
        type: "link",
        label: "New Orders",
        path: "/admin/dudhwala/new-orders",
        icon: "ShoppingBag",
      },
      {
        type: "link",
        label: "Active Plans",
        path: "/admin/dudhwala/active-plans",
        icon: "PlayCircle",
      },
      {
        type: "link",
        label: "Paused Plans",
        path: "/admin/dudhwala/paused-plans",
        icon: "PauseCircle",
      },
    ],
  },
  {
    type: "section",
    label: "HISTORY",
    items: [
      {
        type: "link",
        label: "Expired Plans",
        path: "/admin/dudhwala/expired-plans",
        icon: "History",
      },
      {
        type: "link",
        label: "Rejected / Deactivated",
        path: "/admin/dudhwala/rejected-plans",
        icon: "XCircle",
      },
    ],
  },
  {
    type: "section",
    label: "SYSTEM",
    items: [
      {
        type: "link",
        label: "Dropdown Management",
        path: "/admin/dudhwala/dropdowns",
        icon: "Settings2",
      },
      {
        type: "link",
        label: "Why Chotuu?",
        path: "/admin/dudhwala/why-chotuu",
        icon: "Sparkles",
      },
    ],
  },
];
