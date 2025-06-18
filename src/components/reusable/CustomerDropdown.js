import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  CircularProgress,
  Typography,
  Divider
} from '@mui/material';
import { ErrorOutline, Person, DirectionsCar } from '@mui/icons-material';

const CustomerDropdown = ({ 
  value, 
  onChange, 
  showVehicleDropdown = false, 
  onVehicleChange, 
  vehicleValue,
  customerOptions: externalOptions,
  disabled = false
}) => {
  const [internalCustomerOptions, setInternalCustomerOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState(null);

  // Use external options if provided, otherwise fetch internally
  const customerOptions = externalOptions || internalCustomerOptions;

  useEffect(() => {
    if (!externalOptions) {
      const fetchCustomers = async () => {
        setLoadingCustomers(true);
        setError(null);
        try {
          const res = await axios.get('http://localhost:5000/api/customers');
          setInternalCustomerOptions(res.data);
        } catch (err) {
          console.error('Error fetching customers:', err);
          setError('Failed to load customers');
        } finally {
          setLoadingCustomers(false);
        }
      };
      fetchCustomers();
    }
  }, [externalOptions]);

  useEffect(() => {
    if (value && showVehicleDropdown) {
      const fetchVehicles = async () => {
        const selectedCustomer = customerOptions.find(c => c.accountName === value);
        if (selectedCustomer) {
          setLoadingVehicles(true);
          setError(null);
          try {
            const res = await axios.get(`http://localhost:5000/api/vehicles/${selectedCustomer.customerId}`);
            setVehicleOptions(res.data);
          } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to load vehicles');
          } finally {
            setLoadingVehicles(false);
          }
        }
      };
      fetchVehicles();
    }
  }, [value, customerOptions, showVehicleDropdown]);

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={showVehicleDropdown ? 6 : 12}>
          <FormControl fullWidth>
            {loadingCustomers ? (
              <Box display="flex" alignItems="center">
                <CircularProgress size={24} />
                <Typography variant="body2" ml={2}>Loading customers...</Typography>
              </Box>
            ) : (
              <>
                <InputLabel id="customer-select-label">
                  <Box display="flex" alignItems="center">
                    <Person fontSize="small" sx={{ mr: 1 }} />
                    Select Party
                  </Box>
                </InputLabel>
                <Select
                  sx={{ minWidth: 160 }}
                  labelId="customer-select-label"
                  value={value || ''}
                  onChange={e => onChange(e.target.value)}
                  label={
                    <Box display="flex" alignItems="center">
                      <Person fontSize="small" sx={{ mr: 1 }} />
                      Select Party
                    </Box>
                  }
                  disabled={disabled || loadingCustomers}
                  renderValue={(selected) => {
                    if (!selected) return 'Select Party';
                    const customer = customerOptions.find(c => c.accountName === selected);
                    return customer ? customer.accountName : selected;
                  }}
                >
                  <MenuItem value="">
                    <em>Select Party</em>
                  </MenuItem>
                  {customerOptions.map(customer => (
                    <MenuItem 
                      key={customer.customerId} 
                      value={customer.accountName}
                    >
                      {customer.accountName}
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
          </FormControl>
        </Grid>

        {showVehicleDropdown && (
          <Grid item xs={6}>
            <FormControl fullWidth>
              {loadingVehicles ? (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={24} />
                  <Typography variant="body2" ml={2}>Loading vehicles...</Typography>
                </Box>
              ) : (
                <>
                  <InputLabel id="vehicle-select-label">
                    <Box display="flex" alignItems="center">
                      <DirectionsCar fontSize="small" sx={{ mr: 1 }} />
                      Select Vehicle
                    </Box>
                  </InputLabel>
                  <Select
                    sx={{ minWidth: 200 }}
                    labelId="vehicle-select-label"
                    value={vehicleValue || ''}
                    onChange={e => onVehicleChange(e.target.value)}
                    label={
                      <Box display="flex" alignItems="center">
                        <DirectionsCar fontSize="small" sx={{ mr: 1 }} />
                        Select Vehicle
                      </Box>
                    }
                    disabled={!value || disabled}
                    renderValue={(selected) => {
                      if (!selected) return 'Select Vehicle';
                      return selected;
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Vehicle</em>
                    </MenuItem>
                    <MenuItem value="GENSET">GENSET</MenuItem>
                    {vehicleOptions.map((v, i) => (
                      <MenuItem key={i} value={v.vehicleNumber}>
                        {v.vehicleNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </>
              )}
            </FormControl>
          </Grid>
        )}
      </Grid>

      {error && (
        <Box mt={1} display="flex" alignItems="center">
          <ErrorOutline color="error" fontSize="small" />
          <Typography variant="body2" color="error" ml={1}>
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CustomerDropdown;