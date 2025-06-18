import React from 'react';
import {
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const PumpConfigForm = ({ rows, productList, addRow, removeRow, updateRow, submitData }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {rows.map((row, index) => (
        <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Product ID</InputLabel>
              <Select
                sx={{minWidth:200}}
                value={row.productId}
                onChange={(e) => {
                  const selected = productList.find(p => p.productId === parseInt(e.target.value));
                  updateRow(index, 'productId', selected?.productId || '');
                  updateRow(index, 'productName', selected?.name || '');
                }}
                label="Product ID"
              >
                <MenuItem value="">Select Product</MenuItem>
                {productList.map(product => (
                  <MenuItem key={product.productId} value={product.productId}>
                    {product.productId} - {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Product Name"
              value={row.productName}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              label="Pump Code"
              value={row.pumpCode}
              onChange={(e) => updateRow(index, 'pumpCode', e.target.value)}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              label="Initial Reading"
              type="number"
              value={row.initialReading}
              onChange={(e) => updateRow(index, 'initialReading', e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            {index > 0 && (
              <IconButton
                onClick={() => removeRow(index)}
                color="error"
                aria-label="remove row"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addRow}
        >
          Add Row
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={submitData}
          disabled={!rows.some(row => row.productId && row.pumpCode)}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default PumpConfigForm;