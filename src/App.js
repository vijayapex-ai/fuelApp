import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SidebarLayout from './components/layout/SidebarLayout';
import Dashboard from './pages/Dashboard';
import FuelEntry from './pages/FuelEntry';
import AddProduct from './pages/AddProduct';
import AddGSTTax from './pages/AddGSTTax';
import ProductMaster from './pages/ProductMaster';
import CustomerMaster from './pages/CustomerMaster';
import AssignVehicle from './pages/AssignVehicle';
import GSTSalesForm from './pages/GstBill';
import Login from './pages/Login/Login';
import PumpConfiguration from './pages/PumbReading/PumpConfiguration';
import PumpClosingReading from './pages/PumbReading/PumpClosingReading';
import PrivateRoute from './fpaths/PrivateRoute';
import PublicRoute from './fpaths/PublicRoute';
import DayBookEntry from './pages/Reports/DaybookEntry';
import GSTSalesSummaryReport from './pages/Reports/GstSalesSummary';
import FullShiftReport from './pages/Reports/DailyReportFullShift';
import ShiftReport from './pages/Reports/SingleShiftReport';
import BillListScreen from './pages/Reports/BillListCredit';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route element={<SidebarLayout />}>
          <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/fuel-entry" element={<PrivateRoute><FuelEntry /></PrivateRoute>} />
          <Route path="/add-product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
          <Route path="/add-gst" element={<PrivateRoute><AddGSTTax /></PrivateRoute>} />
          <Route path="/daybook" element={<PrivateRoute><DayBookEntry /></PrivateRoute>} />
          <Route path="/gstsalessumary" element={<PrivateRoute><GSTSalesSummaryReport /></PrivateRoute>} />
          <Route path="/fullshiftreport" element={<PrivateRoute><FullShiftReport /></PrivateRoute>} />
          <Route path="/shift-report" element={<PrivateRoute><ShiftReport /></PrivateRoute>} />
          <Route path="/billlist-credit" element={<PrivateRoute><BillListScreen /></PrivateRoute>} />
          <Route path="/add-productmaster" element={<PrivateRoute><ProductMaster /></PrivateRoute>} />
          <Route path="/add-customermaster" element={<PrivateRoute><CustomerMaster /></PrivateRoute>} />
          <Route path="/assign-vehicle" element={<PrivateRoute><AssignVehicle /></PrivateRoute>} />
          <Route path="/gst-bill" element={<PrivateRoute><GSTSalesForm /></PrivateRoute>} />
          <Route path="/pump-config" element={<PrivateRoute><PumpConfiguration /></PrivateRoute>} />
          <Route path="/pump-reading" element={<PrivateRoute><PumpClosingReading /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
