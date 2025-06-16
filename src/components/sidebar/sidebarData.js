import { 
  Fuel, 
  FileText, 
  BarChart3, 
  Database, 
  PackagePlus, 
  DollarSign, 
  FileSpreadsheet, 
  Users, 
  Truck 
} from 'lucide-react';
import React from 'react';

// Menu items configuration
export const menuItems = [
  { 
    name: 'BILL ENTRY', 
    path: '/fuel-entry', 
    icon: <Fuel size={20} /> 
  },
  { 
    name: 'GST BILL', 
    path: '/gst-bill', 
    icon: <FileText size={20} /> 
  },
  { 
    name: 'PUMP READING', 
    path: '/pump-reading', 
    icon: <BarChart3 size={20} /> 
  },
  { 
    name: 'PUMP Config', 
    path: '/pump-config', 
    icon: <BarChart3 size={20} /> 
  },
  {
    name: 'MASTER',
    icon: <Database size={20} />,
    children: [
      { 
        name: 'ADD PRODUCT', 
        path: '/add-product', 
        icon: <PackagePlus size={18} /> 
      },
      { 
        name: 'ASSIGN GST HSN', 
        path: '/add-gst', 
        icon: <FileSpreadsheet size={18} /> 
      },
      { 
        name: 'PRODUCT MASTER', 
        path: '/add-productmaster', 
        icon: <FileText size={18} /> 
      },
      { 
        name: 'ADD CUSTOMER', 
        path: '/add-customermaster', 
        icon: <Users size={18} /> 
      },
      { 
        name: 'ASSIGN VECHILE', 
        path: '/assign-vehicle', 
        icon: <Truck size={18} /> 
      },
    ],
  },

  {
    name: 'Reports',
    icon: <Database size={20} />,
    children: [
      { 
        name: 'DAYBOOK ENTRY', 
        path: '/daybook', 
        icon: <PackagePlus size={18} /> 
      },
      { 
        name: 'Daily Report Full', 
        path: '/fullshiftreport', 
        icon: <FileSpreadsheet size={18} /> 
      },
      { 
        name: 'Single Shift Report', 
        path: '/shift-report', 
        icon: <FileText size={18} /> 
      },
      { 
        name: 'Bill-List Credit', 
        path: '/billlist-credit', 
        icon: <Users size={18} /> 
      },
      { 
        name: 'GST Sales Summary', 
        path: '/gstsalessumary', 
        icon: <Truck size={18} /> 
      },
    ],
  },
];
