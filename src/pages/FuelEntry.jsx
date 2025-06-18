import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contextApi/UserContext';
import CustomerDropdown from '../components/reusable/CustomerDropdown';
import {
  Container,
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  Snackbar,
  Autocomplete,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { AddCircleOutline, Save } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const StyledHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: '100%',
  marginBottom: theme.spacing(2),
}));

const FuelEntry = () => {
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
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, customersRes, billRes] = await Promise.all([
          axios.get('http://localhost:5000/api/products'),
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/billEntry/next-bill-number'),
        ]);

        setProductOptions(productsRes.data);
        setCustomerOptions(customersRes.data);

        setForm((prev) => ({
          ...prev,
          billNumber: billRes.data.nextBillNumber.toString()
        }));

      } catch (err) {
        console.error('Error fetching data:', err);
        showSnackbar('Error fetching initial data', 'error');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };

    if (field === 'partyName') {
      const selectedCustomer = customerOptions.find(c => c.accountName === value);
      if (selectedCustomer) {
        axios.get(`http://localhost:5000/api/vehicles/${selectedCustomer.customerId}`)
          .then(res => setVehicleOptions(res.data))
          .catch(err => {
            console.error('Error fetching vehicles:', err);
            showSnackbar('Error fetching vehicle data', 'error');
          });
      } else {
        setVehicleOptions([]);
      }
    }

    // Calculate amount if qty is changed
    if (field === 'qty') {
      const qty = parseFloat(value);
      const rate = parseFloat(updatedForm.rate);
      if (!isNaN(qty) && !isNaN(rate)) {
        updatedForm.amount = (qty * rate).toFixed(2);
      }
    }

    // Calculate qty if amount is changed
    if (field === 'amount') {
      const amount = parseFloat(value);
      const rate = parseFloat(updatedForm.rate);
      if (!isNaN(amount) && !isNaN(rate) && rate !== 0) {
        updatedForm.qty = (amount / rate).toFixed(3);
      }
    }

    // Recalculate if rate is changed
    if (field === 'rate') {
      const rate = parseFloat(value);
      const qty = parseFloat(updatedForm.qty);
      if (!isNaN(rate)) {
        if (!isNaN(qty)) {
          updatedForm.amount = (qty * rate).toFixed(2);
        } else if (updatedForm.amount) {
          const amount = parseFloat(updatedForm.amount);
          if (!isNaN(amount) && rate !== 0) {
            updatedForm.qty = (amount / rate).toFixed(3);
          }
        }
      }
    }

    setForm(updatedForm);
  };

  const handleProductChange = (e, newValue) => {
    const selectedProduct = productOptions.find(p => p.name === newValue);
    if (!selectedProduct) return;

    const updatedForm = {
      ...form,
      productName: selectedProduct.name,
      code: selectedProduct.productId,
      unit: "LTR",
      rate: selectedProduct.rate
    };

    if (form.qty) {
      updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
    } else if (form.amount) {
      updatedForm.qty = (parseFloat(form.amount) / parseFloat(updatedForm.rate)).toFixed(3);
    }

    setForm(updatedForm);
  };

  const handleCodeChange = (e) => {
    const productId = e.target.value;
    handleChange('code', productId);

    const selectedProduct = productOptions.find(p => p.productId == productId);
    if (selectedProduct) {
      const updatedForm = {
        ...form,
        code: selectedProduct.productId,
        productName: selectedProduct.name,
        unit: "LTR",
        rate: selectedProduct.rate
      };

      if (form.qty) {
        updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
      } else if (form.amount) {
        updatedForm.qty = (parseFloat(form.amount) / parseFloat(updatedForm.rate)).toFixed(3);
      }

      setForm(updatedForm);
    }
  };

  const handleAddProduct = () => {
    if (!form.code || !form.qty || !form.rate) {
      showSnackbar('Please fill all product fields', 'error');
      return;
    }

    const selectedProduct = productOptions.find(p => p.productId == form.code);
    if (!selectedProduct) {
      showSnackbar('Please select a valid product', 'error');
      return;
    }

    const newProduct = {
      code: form.code,
      productName: form.productName,
      unit: form.unit,
      gstProduct: selectedProduct.gstProduct,
      qty: form.qty,
      rate: form.rate,
      amount: form.amount
    };

    setForm({
      ...form,
      productList: [...form.productList, newProduct],
      code: '',
      productName: '',
      unit: '',
      qty: '',
      rate: '',
      amount: ''
    });
  };

  const handleSaveBill = async () => {
    if (form.productList.length === 0) {
      showSnackbar('Please add at least one product', 'error');
      return;
    }

    try {
      const payload = {
        ...form,
        shiftNo: user.shiftNo,
        shiftDate: user.shiftDate,
      };

      const res = await axios.post('http://localhost:5000/api/billEntry/save', payload);
      showSnackbar('Bill saved successfully!');
      console.log(res.data);

      // Reset form after successful save
      const billRes = await axios.get('http://localhost:5000/api/billEntry/next-bill-number');
      setForm({
        ...form,
        billNumber: billRes.data.nextBillNumber.toString(),
        productList: [],
        partyName: '',
        vehicleNumber: '',
        indentNumber: ''
      });
    } catch (err) {
      console.error('Error saving bill:', err);
      showSnackbar('Failed to save bill', 'error');
    }
  };

  return (
    <Container maxWidth="lg">
      <StyledPaper elevation={3}>
        <StyledHeader>
          <Box>
            <Typography variant="subtitle1">
              Shift Date: {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Bill Entry
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2">User Name: {user.username}</Typography>
            <Typography variant="body2">Shift: {user.shiftNo}</Typography>
            <Typography variant="body2">Shift Date: {user.shiftDate}</Typography>
            <Typography variant="body2">Time: {currentTime}</Typography>
          </Box>
        </StyledHeader>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <StyledFormControl>
              <InputLabel id="bill-print-label">Bill Print</InputLabel>
              <Select
                labelId="bill-print-label"
                value={form.billPrint}
                onChange={(e) => handleChange('billPrint', e.target.value)}
                label="Bill Print"
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </StyledFormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Bill Number"
              value={form.billNumber}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StyledFormControl>
              <InputLabel id="mode-of-sales-label">Mode of Sales</InputLabel>
              <Select
                labelId="mode-of-sales-label"
                value={form.modeOfSales}
                onChange={(e) => handleChange('modeOfSales', e.target.value)}
                label="Mode of Sales"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Credit">Credit</MenuItem>
              </Select>
            </StyledFormControl>
          </Grid>

          {form.modeOfSales === 'Credit' ? (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <CustomerDropdown
                  value={form.partyName}
                  onChange={(val) => handleChange('partyName', val)}
                  showVehicleDropdown={true}
                  onVehicleChange={(val) => handleChange('vehicleNumber', val)}
                  vehicleValue={form.vehicleNumber}
                  customerOptions={customerOptions}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Indent Number"
                  value={form.indentNumber}
                  onChange={(e) => handleChange('indentNumber', e.target.value)}
                  fullWidth
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Party Name"
                  value={form.partyName}
                  onChange={(e) => handleChange('partyName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Vehicle Number"
                  value={form.vehicleNumber}
                  onChange={(e) => handleChange('vehicleNumber', e.target.value)}
                  fullWidth
                />
              </Grid>
            </>
          )}
        </Grid>

        <Typography variant="h6" gutterBottom>Add Products</Typography>
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Code"
              value={form.code}
              onChange={handleCodeChange}
              fullWidth
              inputProps={{ list: "productCodes" }}
            />
            <datalist id="productCodes">
              {productOptions.map(p => (
                <option key={p.productId} value={p.productId}>
                  {p.name} {p.category}
                </option>
              ))}
            </datalist>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ minWidth: 200 }}>
              <Autocomplete
                fullWidth
                options={productOptions.map(p => p.name)}
                value={form.productName}
                onChange={handleProductChange}
                renderInput={(params) => (
                  <TextField {...params} label="Product" fullWidth />
                )}
              />
            </Box>
          </Grid>


          <Grid item xs={12} sm={6} md={1}>
            <TextField
              label="Unit"
              value={form.unit}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <TextField
              label="Qty"
              type="number"
              value={form.qty}
              onChange={(e) => handleChange('qty', e.target.value)}
              fullWidth
              inputProps={{ min: "0", step: "0.001" }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <TextField
              label="Rate"
              type="number"
              value={form.rate}
              onChange={(e) => handleChange('rate', e.target.value)}
              fullWidth
              inputProps={{ min: "0", step: "0.01" }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              fullWidth
              inputProps={{ min: "0", step: "0.01" }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddProduct}
              startIcon={<AddCircleOutline />}
              fullWidth
            >
              Add
            </Button>
          </Grid>
        </Grid>

        {form.productList.length > 0 ? (
          <Table sx={{ mb: 3 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>S.No</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="center">Unit</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.productList.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell align="center">{item.unit}</TableCell>
                  <TableCell align="right">{parseFloat(item.qty).toFixed(3)}</TableCell>
                  <TableCell align="right">{parseFloat(item.rate).toFixed(2)}</TableCell>
                  <TableCell align="right">{item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body1" color="text.secondary" textAlign="center" my={3}>
            No products added yet
          </Typography>
        )}

        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="success"
            onClick={handleSaveBill}
            startIcon={<Save />}
            size="large"
          >
            Save Bill
          </Button>
        </Box>
      </StyledPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FuelEntry;