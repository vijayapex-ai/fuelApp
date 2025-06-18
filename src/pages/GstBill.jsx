import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  Container
} from '@mui/material';
import { useUser } from '../contextApi/UserContext';
import CustomerDropdown from '../components/reusable/CustomerDropdown';
import ProductSelection from './GstBillEntry/ProductSelection'; // New component for product selection
import BillSummary from './GstBillEntry/BillSummary'; // New component for bill summary

const GSTSalesForm = () => {
  const [form, setForm] = useState({
    billNumber: '',
    partyName: '',
    indentNumber: '',
    billPrint: 'Yes',
    modeOfSales: 'Cash',
    vehicleNumber: '',
    saleType: 'S',
    discount: '',
    code: '',
    productName: '',
    unit: '',
    qty: '',
    rate: '',
    amount: '',
    productList: [],
  });

  const { user } = useUser();
  const [productOptions, setProductOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [isInterState, setIsInterState] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, customersRes, taxesRes, billRes] = await Promise.all([
          axios.get('http://localhost:5000/api/productmaster'),
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/gsttax'),
          axios.get('http://localhost:5000/api/gstbillEntry/next-bill-number')
        ]);

        setProductOptions(productsRes.data);
        setCustomerOptions(customersRes.data);
        setTaxOptions(taxesRes.data);

        setForm(prev => ({
          ...prev,
          billNumber: billRes.data.nextBillNumber.toString()
        }));

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };

    if (field === 'partyName') {
      const selectedCustomer = customerOptions.find(c => c.accountName === value);
      if (selectedCustomer) {
        axios.get(`http://localhost:5000/api/vehicles/${selectedCustomer.customerId}`)
          .then(res => setVehicleOptions(res.data))
          .catch(err => console.error('Error fetching vehicles:', err));
      } else {
        setVehicleOptions([]);
      }
    }

    if (field === 'saleType' && form.productName) {
      const selectedProduct = productOptions.find(p => p.productName === form.productName);
      if (selectedProduct) {
        updatedForm.rate = value === 'S' ? selectedProduct.salesRate : selectedProduct.mrp;
        if (form.qty) {
          updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate));
        }
      }
    }

    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(field === 'qty' ? value : updatedForm.qty);
      const rate = parseFloat(field === 'rate' ? value : updatedForm.rate);
      if (!isNaN(qty) && !isNaN(rate)) {
        updatedForm.amount = (qty * rate).toFixed(2);
      }
    }

    setForm(updatedForm);
  };

  const handleProductChange = (selectedProduct) => {
    if (!selectedProduct) return;

    const updatedForm = { 
      ...form,
      productName: selectedProduct.productName,
      code: selectedProduct.productId,
      unit: selectedProduct.unitOfMeasurement,
      gstProduct: selectedProduct.gstProduct,
      rate: form.saleType === 'S' ? selectedProduct.salesRate : selectedProduct.mrp
    };

    if (form.qty) {
      updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate));
    }

    setForm(updatedForm);
  };

  const handleAddProduct = (newProduct) => {
    setForm(prev => ({
      ...prev,
      productList: [...prev.productList, newProduct],
      code: '',
      productName: '',
      unit: '',
      qty: '',
      rate: '',
      amount: ''
    }));
  };

  const calculateTaxes = (products) => {
    let totalAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    products.forEach(product => {
      const amount = parseFloat(product.amount) || 0;
      totalAmount += amount;

      const productTax = taxOptions.find(tax => 
        tax.description.trim().toUpperCase() === product.gstProduct.trim().toUpperCase()
      );
    
      if (productTax) {
        if (isInterState) {
          totalIGST += amount * (productTax.igst / 100);
        } else {
          totalCGST += amount * (productTax.cgst / 100);
          totalSGST += amount * (productTax.sgst / 100);
        }
      }
    });

    return {
      totalAmount: totalAmount.toFixed(2),
      cgst: totalCGST.toFixed(2),
      sgst: totalSGST.toFixed(2),
      igst: totalIGST.toFixed(2),
      grandTotal: (totalAmount + totalCGST + totalSGST + totalIGST).toFixed(2)
    };
  };

  const handleSaveBill = async () => {
    try {
      const payload = {
        ...form,
        shiftNo: user.shiftNo,
        shiftDate: user.shiftDate,
        isInterState
      };

      const res = await axios.post('http://localhost:5000/api/gstbillEntry/save', payload);
      alert('Bill saved successfully!');
      console.log(res.data);
    } catch (err) {
      console.error('Error saving bill:', err);
      alert('Failed to save bill');
    }
  };

  const taxSummary = calculateTaxes(form.productList);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="subtitle1">
            Shift Date: {new Date().toLocaleDateString()}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            GST SALES
          </Typography>
          <Box textAlign="right">
            <Typography variant="subtitle1">User Name: {user?.name || 'JAI SHANKAR'}</Typography>
            <Typography variant="subtitle1">Time: {currentTime}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Bill Information Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Bill Number"
              value={form.billNumber}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Mode of Sales</InputLabel>
              <Select
                value={form.modeOfSales}
                onChange={(e) => handleChange('modeOfSales', e.target.value)}
                label="Mode of Sales"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Credit">Credit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            {form.modeOfSales === 'Credit' ? (
              <CustomerDropdown
                value={form.partyName}
                onChange={(val) => handleChange('partyName', val)}
                showVehicleDropdown={true}
                onVehicleChange={(val) => handleChange('vehicleNumber', val)}
                vehicleValue={form.vehicleNumber}
                customers={customerOptions}
              />
            ) : (
              <>
                <TextField
                  label="Party Name"
                  value={form.partyName}
                  onChange={(e) => handleChange('partyName', e.target.value)}
                  variant="outlined"
                />
                <TextField
                  label="Vehicle Number"
                  value={form.vehicleNumber}
                  onChange={(e) => handleChange('vehicleNumber', e.target.value)}
                  variant="outlined"
                  sx={{ml:2}}
                  
                />
              </>
            )}
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Indent Number"
              value={form.indentNumber}
              onChange={(e) => handleChange('indentNumber', e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Sale Type</InputLabel>
              <Select
                value={form.saleType}
                onChange={(e) => handleChange('saleType', e.target.value)}
                label="Sale Type"
              >
                <MenuItem value="S">Sales Rate</MenuItem>
                <MenuItem value="M">MRP</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isInterState}
                  onChange={() => setIsInterState(!isInterState)}
                  color="primary"
                />
              }
              label="Interstate"
            />
          </Grid>
        </Grid>

        {/* Product Selection Section */}
        <Typography variant='h6'fontWeight={700} sx={{mb:2}}>Product Selection</Typography>
        <ProductSelection
          productOptions={productOptions}
          form={form}
          onProductChange={handleProductChange}
          onAddProduct={handleAddProduct}
          taxOptions={taxOptions}
          isInterState={isInterState}
          handleChange={handleChange}
        />

        {/* Products Table */}
        {form.productList.length > 0 && (
          <Table sx={{ mb: 4, border: '1px solid #e0e0e0' }}>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.productList.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="right">{parseFloat(item.qty).toFixed(2)}</TableCell>
                  <TableCell align="right">{parseFloat(item.rate).toFixed(2)}</TableCell>
                  <TableCell align="right">{item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Bill Summary Section */}
        <Typography variant='h6'fontWeight={700} sx={{mb:2}}>Bill Summary</Typography>
        <BillSummary taxSummary={taxSummary} isInterState={isInterState} />

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveBill}
            size="large"
            disabled={form.productList.length === 0}
          >
            Save Bill
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default GSTSalesForm;