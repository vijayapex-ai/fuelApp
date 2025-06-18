import React from 'react';
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Box,
  Autocomplete
} from '@mui/material';

const ProductSelection = ({
  productOptions,
  form,
  onProductChange,
  onAddProduct,
  taxOptions,
  isInterState,
  handleChange
}) => {
  const handleCodeChange = (e) => {
    const productId = e.target.value;
    handleChange('code', productId);

    const selectedProduct = productOptions.find(p => p.productId == productId);
    if (selectedProduct) {
      onProductChange(selectedProduct);
    }
  };

  const handleAddClick = () => {
    const selectedProduct = productOptions.find(p => p.productId == form.code);
    if (!selectedProduct) return;

    const amount = parseFloat(form.amount) || 0;
    const productTax = taxOptions.find(tax => 
      tax.description.trim().toUpperCase() === selectedProduct.gstProduct.trim().toUpperCase()
    );
    
    let hsnCode = productTax?.hsnCode || '';
    let cgst = 0, sgst = 0, igst = 0;

    if (productTax) {
      if (isInterState) {
        igst = amount * (productTax.igst / 100);
      } else {
        cgst = amount * (productTax.cgst / 100);
        sgst = amount * (productTax.sgst / 100);
      }
    }

    const newProduct = {
      code: form.code,
      productName: form.productName,
      unit: form.unit,
      gstProduct: selectedProduct.gstProduct,
      hsnCode: hsnCode,
      qty: form.qty,
      rate: form.rate,
      amount: form.amount,
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2)
    };

    onAddProduct(newProduct);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={2}>
        <TextField
          select
          label="Code"
          value={form.code}
          onChange={handleCodeChange}
          fullWidth
          SelectProps={{ native: true }}
          sx={{minWidth: 150}}
        >
          <option value=""></option>
          {productOptions.map((p) => (
            <option key={p.productId} value={p.productId}>
              {p.productId}
            </option>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={3}>
         <Box sx={{ minWidth: 200 }}>
        <Autocomplete
          
          options={productOptions}
          getOptionLabel={(option) => option.productName}
          value={productOptions.find(p => p.productId == form.code) || null}
          onChange={(e, newValue) => onProductChange(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Product" fullWidth />
          )}
        />
        </Box>
      </Grid>

      <Grid item xs={12} sm={1}>
        <TextField
          label="Unit"
          value={form.unit}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={1}>
        <TextField
          label="Qty"
          type="number"
          value={form.qty}
          onChange={(e) => handleChange('qty', e.target.value)}
          fullWidth
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>

      <Grid item xs={12} sm={1}>
        <TextField
          label="Rate"
          type="number"
          value={form.rate}
          onChange={(e) => handleChange('rate', e.target.value)}
          fullWidth
          inputProps={{ min: 0, step: 0.01 }}
        />
      </Grid>

      <Grid item xs={12} sm={2}>
        <TextField
          label="Amount"
          value={form.amount}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddClick}
          fullWidth
          sx={{ height: '56px' }}
          disabled={!form.code || !form.qty}
        >
          Add Product
        </Button>
      </Grid>
    </Grid>
  );
};

export default ProductSelection;