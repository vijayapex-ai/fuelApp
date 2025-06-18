import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Divider,
  Pagination,
  Box,
  IconButton
} from '@mui/material';
import { useUser } from '../../contextApi/UserContext';
import PumpConfigForm from './PumbConfigurations/PumpConfigForm';
import PumpConfigTable from './PumbConfigurations/PumpConfigTable';

const PumpConfiguration = () => {
  const [productList, setProductList] = useState([]);
  const [rows, setRows] = useState([
    { productId: '', productName: '', pumpCode: '', initialReading: '' }
  ]);
  const [configurations, setConfigurations] = useState([]);
  const [readings, setReadings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const { user } = useUser();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getProducts();
    fetchConfigurations();
    fetchOpeningReadings();
  }, [user.shiftNo, user.shiftDate]);

  const getProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProductList(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  };

  const fetchConfigurations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pump-config');
      const configsWithEdit = res.data.map(config => ({
        ...config,
        isEditing: false,
        tempPumpCode: config.pumpCode
      }));
      setConfigurations(configsWithEdit);
    } catch (err) {
      console.error('Error fetching configurations:', err);
      setError('Failed to load configurations');
    }
  };

  const fetchOpeningReadings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pump-config/opening', {
        params: { shift: user.shiftNo, date: user.shiftDate }
      });
      setReadings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching opening readings:', err);
      setError('Failed to load opening readings');
    }
  };

  const addRow = () => {
    setRows([...rows, { productId: '', productName: '', pumpCode: '', initialReading: '' }]);
  };

  const removeRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const submitData = async () => {
    const isValid = rows.every(row => row.productId && row.productName && row.pumpCode);
    if (!isValid) {
      setError("Please fill all fields before submitting.");
      return;
    }

    try {
      const cleanData = rows.map(row => ({
        productCode: row.productId,
        productName: row.productName,
        pumpCode: row.pumpCode,
      }));

      await axios.post('http://localhost:5000/api/pump-config', cleanData);

      const initialReadingEntries = rows.map(row => ({
        productCode: row.productId,
        productName: row.productName,
        pumpCode: row.pumpCode,
        openingReading: parseFloat(row.initialReading) || 0,
        closingReading: 0,
        saleLitre: 0,
        shift: user.shiftNo,
        date: user.shiftDate,
        readingDate: user.shiftDate,
      }));

      await axios.post('http://localhost:5000/api/pump-config/init-reading', {
        entries: initialReadingEntries
      });

      fetchConfigurations();
      fetchOpeningReadings();
      setRows([{ productId: '', productName: '', pumpCode: '', initialReading: '' }]);
      setSuccess('Configuration saved successfully!');
      setError(null);
    } catch (err) {
      console.error('Error submitting data:', err);
      setError('Failed to save configuration');
      setSuccess(null);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = configurations.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pump Configuration
        </Typography>

        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        {success && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">{success}</Alert>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <PumpConfigForm
          rows={rows}
          productList={productList}
          addRow={addRow}
          removeRow={removeRow}
          updateRow={updateRow}
          submitData={submitData}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          Submitted Configurations
        </Typography>

        <PumpConfigTable
          currentRecords={currentRecords}
          readings={readings}
          configurations={configurations}
          setConfigurations={setConfigurations}
          indexOfFirstRecord={indexOfFirstRecord}
          fetchConfigurations={fetchConfigurations}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(configurations.length / recordsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default PumpConfiguration;