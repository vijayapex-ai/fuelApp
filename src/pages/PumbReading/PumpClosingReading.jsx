import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../contextApi/UserContext';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Container,
  Divider,
  TextField,
  Alert,
  Grid
} from '@mui/material';
import PumpReadingsTable from './PumbReadings/PumpReadingsTable';
import ProductSummaryTable from './PumbReadings/ProductSummaryTable';

const PumpClosingReading = () => {
  const [readings, setReadings] = useState([]);
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const { user } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [billTotals, setBillTotals] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const shiftRef = useRef('');
  const dateRef = useRef('');

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/billEntry/product-totals', {
          params: {
            shiftDate: user.shiftDate,
            shiftNo: user.shiftNo
          }
        });
        setBillTotals(response.data);
      } catch (err) {
        console.error('Error fetching bill totals:', err);
        setError('Failed to load bill totals');
      }
    };

    fetchBillData();
  }, [user.shiftNo, user.shiftDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, openingRes, closingRes] = await Promise.all([
          axios.get('http://localhost:5000/api/pump-config'),
          axios.get(`http://localhost:5000/api/pump-config/opening`, {
            params: { 
              shift: user.shiftNo,
              date: user.shiftDate
            }
          }),
          axios.get(`http://localhost:5000/api/pump-config/closing`, {
            params: {
              shift: user.shiftNo,
              date: user.shiftDate
            }
          })
        ]);

        const configData = configRes.data;
        const openingData = Array.isArray(openingRes.data) ? openingRes.data : [];
        const closingData = Array.isArray(closingRes.data) ? closingRes.data : [];

        const merged = configData.map(config => {
          const openingMatch = openingData.find(o => o.pumpCode === config.pumpCode);
          const closingMatch = closingData.find(c => c.pumpCode === config.pumpCode);

          let saleLTR = '0.00';
          if (closingMatch && openingMatch) {
            saleLTR = (parseFloat(closingMatch.closingReading) - parseFloat(openingMatch.openingReading)).toFixed(2);
          }

          return {
            ...config,
            id: openingMatch?.id || closingMatch?.id,
            openingReading: openingMatch?.openingReading || '0.00',
            closingReading: closingMatch?.closingReading || '0.00',
            saleLTR: saleLTR,
            status: closingMatch?.status || openingMatch?.status || 'pending'
          };
        });

        setReadings(merged);
        const shiftClosed = closingData.length > 0 && closingData.every(c => c.status === 'closed');
        setIsShiftClosed(shiftClosed);

        const allFilled = merged.every(
          r => parseFloat(r.openingReading) > 0 && parseFloat(r.closingReading) > 0
        );
        setIsSaveButtonDisabled(!allFilled && !shiftClosed);

      } catch (err) {
        console.error('Error fetching config/opening/closing data:', err);
        setError('Failed to load pump readings');
      }
    };

    fetchData();
  }, [user.shiftNo, user.shiftDate]);

  const toggleEditMode = () => {
    const closedEntries = readings.filter(r => r.status === 'closed');
    if (closedEntries.length === 0) {
      setError("There are no closed shifts to edit.");
      return;
    }

    const lastClosedEntry = closedEntries
      .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate) || b.shift - a.shift)[0];

    const entryDate = new Date(lastClosedEntry.readingDate || lastClosedEntry.date);
    const userDate = new Date(user.shiftDate);

    if (lastClosedEntry && 
        entryDate.toDateString() === userDate.toDateString() && 
        lastClosedEntry.shift === user.shiftNo) {
      setEditMode(!editMode);
      setError(null);
    } else {
      setError("Only the last closed shift for the current date and shift can be edited.");
    }
  };

  const handleInputChange = (index, field, value) => {
    if (!editMode && isShiftClosed) return;

    const updated = [...readings];
    updated[index][field] = value;

    const open = parseFloat(updated[index].openingReading || 0);
    const close = parseFloat(value || 0);

    updated[index].saleLTR = (close - open).toFixed(2);
    updated[index].status = editMode ? 'edited' : 'active';

    setReadings(updated);

    const allFilled = updated.every(
      (r) => parseFloat(r.openingReading) > 0 && parseFloat(r.closingReading) > 0
    );
    setIsSaveButtonDisabled(!allFilled);
  };

  const handleKeyDown = (e, index) => {
    if (isShiftClosed) return;
    
    if (e.key === 'Enter' || e.key === 'Tab') {
      const entry = readings[index];
      const close = parseFloat(entry.closingReading || 0);
      if (!isNaN(close) && close > 0) {
        saveReading({ ...entry, status: 'active' });
      }
    }
  };

  const saveReading = async (entry) => {
    try {            
      await axios.post('http://localhost:5000/api/pump-config/entry', {
        entries: [
          {
            id: entry.id,
            pumpCode: entry.pumpCode,
            openingReading: parseFloat(entry.openingReading),
            closingReading: parseFloat(entry.closingReading),
            saleLitre: parseFloat(entry.saleLTR),
            productCode: entry.productCode,
            productName: entry.productName,
            shift: shiftRef.current,
            readingDate: dateRef.current,
            status: entry.status
          }
        ]
      });
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save reading');
    }
  };

  const handleSave = async () => {
    if (isShiftClosed && !editMode) return;

    try {
      const formattedEntries = readings.map(r => ({
        id: r.id || null,
        pumpCode: r.pumpCode,
        productCode: r.productCode,
        productName: r.productName,
        openingReading: parseFloat(r.openingReading) || 0,
        closingReading: parseFloat(r.closingReading) || 0,
        saleLitre: parseFloat(r.saleLTR) || 0,
        shift: user.shiftNo,
        date: user.shiftDate,
        readingDate: user.shiftDate,
        status: editMode ? 'closed' : 'closed'
      }));

      await axios.post('http://localhost:5000/api/pump-config/entry', {
        entries: formattedEntries
      });

      if (!editMode) {
        const nextShiftNumber = user.shiftNo === '1' ? '2' : '1';
        const nextShiftDate = user.shiftNo === '1' 
          ? user.shiftDate 
          : getNextDay(user.shiftDate);

        const nextShiftEntries = formattedEntries.map(e => ({
          pumpCode: e.pumpCode,
          productCode: e.productCode,
          productName: e.productName,
          openingReading: e.closingReading,
          closingReading: 0,
          saleLitre: 0,
          shift: nextShiftNumber,
          date: user.shiftDate,
          readingDate: nextShiftDate,
          status: 'pending'
        }));

        await axios.post('http://localhost:5000/api/pump-config/next-shift-opening', {
          entries: nextShiftEntries,
          currentShift: parseInt(user.shiftNo),
          date: user.shiftDate
        });
      }

      setReadings(prev => prev.map(r => ({ ...r, status: 'closed' })));
      setIsSaveButtonDisabled(true);
      setIsShiftClosed(true);
      setEditMode(false);
      setSuccess(editMode ? 'Changes saved successfully!' : 'Shift closed successfully!');
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to save: ${err.response?.data?.message || err.message}`);
      setSuccess(null);
    }
  };

  const getNextDay = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const calculateProductTotals = () => {
    const productMap = {};
  
    readings.forEach(reading => {
      if (!productMap[reading.productName]) {
        productMap[reading.productName] = {
          opening: 0,
          closing: 0,
          billQty: 0,
          sale: 0,
          pumpCount: 0
        };
      }
  
      productMap[reading.productName].opening += parseFloat(reading.openingReading) || 0;
      productMap[reading.productName].closing += parseFloat(reading.closingReading) || 0;
      productMap[reading.productName].sale += parseFloat(reading.saleLTR) || 0;
      productMap[reading.productName].pumpCount += 1;
    });
  
    billTotals.forEach(bill => {
      if (productMap[bill.productName]) {
        productMap[bill.productName].billQty = parseFloat(bill.totalQty) || 0;
        productMap[bill.productName].billCount = bill.billCount || 0;
      }
    });
  
    return Object.entries(productMap).map(([productName, totals]) => ({
      productName,
      openingTotal: totals.opening.toFixed(2),
      closingTotal: totals.closing.toFixed(2),
      billQty: totals.billQty.toFixed(2),
      saleTotal: totals.sale.toFixed(2),
      difference: (totals.sale - totals.billQty).toFixed(2),
      pumpCount: totals.pumpCount
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          PUMP CLOSING READING - ENTRY
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {isShiftClosed && (
          <Button
            onClick={toggleEditMode}
            variant="contained"
            color={editMode ? "error" : "primary"}
            sx={{ mb: 2 }}
          >
            {editMode ? 'Cancel Edit' : 'Edit Mode'}
          </Button>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1">
              <strong>Shift Date:</strong> {user.shiftDate}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1">
              <strong>Shift No.:</strong> {user.shiftNo}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1">
              <strong>User Name:</strong> {user.username}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1">
              <strong>Current Time:</strong> {new Date().toLocaleTimeString()}
            </Typography>
          </Grid>
        </Grid>

        {isShiftClosed && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This shift has been closed!
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <PumpReadingsTable 
          readings={readings} 
          editMode={editMode}
          isShiftClosed={isShiftClosed}
          handleInputChange={handleInputChange}
          handleKeyDown={handleKeyDown}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          Product Summary
        </Typography>

        <ProductSummaryTable productTotals={calculateProductTotals()} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {editMode ? (
            <Button
              onClick={handleSave}
              variant="contained"
              color="success"
              size="large"
            >
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaveButtonDisabled}
              variant="contained"
              color="success"
              size="large"
            >
              Save/Close
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PumpClosingReading;