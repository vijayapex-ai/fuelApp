const express = require('express');
const app = express();
const cors = require('cors');
const productRoutes = require('../src/routes/productRoutes');
const gstRoutes = require('../src/routes/gstRoutes');
const productmasterRoutes = require('../src/routes/productmasterRoutes');
const customerRoutes = require('../src/routes/customerRoutes');
const vehicleRoutes = require('../src/routes/vehiclesRoutes');
const billEntryRoutes = require('../src/routes/billEntryRoutes');
const gstBillEntryRoute = require('../src/routes/gstBillEntryRoutes');
const pumbReadingRoutes = require('../src/routes/pumbReadingRoutes');
const userRoutes = require('../src/routes/userRoutes');
const DayBookEntryRoutes = require('../src/routes/dayBookEntryRoutes');
const gstsalessummaryRoutes = require('../src/routes/Reports/gstsalessummary');
const fullshiftreportRoutes = require('../src/routes/Reports/Fullshidftreport');
const shiftReportRoutes = require('../src/routes/Reports/ShiftReports');
const billListRoutes = require('../src/routes/Reports/Bill_list');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/gsttax', gstRoutes);
app.use('/api/productmaster', productmasterRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/billEntry', billEntryRoutes)
app.use('/api/gstbillEntry', gstBillEntryRoute)
app.use('/api/pump-config', pumbReadingRoutes)
app.use('/api/users', userRoutes)

{/** Report Routes **/}
app.use('/api/daybookentry', DayBookEntryRoutes)
app.use('/api/gstsalessummary', gstsalessummaryRoutes)
app.use('/api/fullshiftreport', fullshiftreportRoutes)
app.use('/api/shift-reports', shiftReportRoutes)
app.use('/api/bill-list', billListRoutes)

// Start server
app.listen(5000, () => {
  console.log('✅ API running on http://localhost:5000');
});