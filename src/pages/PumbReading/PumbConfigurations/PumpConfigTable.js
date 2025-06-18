import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const PumpConfigTable = ({
  currentRecords,
  readings,
  configurations,
  setConfigurations,
  indexOfFirstRecord,
  fetchConfigurations
}) => {
  const handleUpdate = async (index) => {
    try {
      const updatedConfig = configurations[indexOfFirstRecord + index];
      await axios.put(
        `http://localhost:5000/api/pump-config/${updatedConfig.id}`,
        { pumpCode: updatedConfig.tempPumpCode }
      );
      fetchConfigurations();
    } catch (err) {
      console.error('Error updating:', err);
    }
  };

  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell>Product Code</TableCell>
          <TableCell>Product Name</TableCell>
          <TableCell>Pump Code</TableCell>
          <TableCell>Opening Reading</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {currentRecords.map((config, idx) => {
          const matchedReading = readings.find(r => r.pumpCode === config.pumpCode);
          return (
            <TableRow key={config.id} hover>
              <TableCell>{config.productCode}</TableCell>
              <TableCell>{config.productName}</TableCell>
              <TableCell>
                {config.isEditing ? (
                  <TextField
                    value={config.tempPumpCode}
                    onChange={(e) => {
                      const updated = [...configurations];
                      updated[indexOfFirstRecord + idx].tempPumpCode = e.target.value;
                      setConfigurations(updated);
                    }}
                    size="small"
                  />
                ) : (
                  config.pumpCode
                )}
              </TableCell>
              <TableCell>{matchedReading ? matchedReading.openingReading : '0.00'}</TableCell>
              <TableCell>
                {config.isEditing ? (
                  <IconButton
                    onClick={() => handleUpdate(idx)}
                    color="primary"
                    aria-label="save"
                  >
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() => {
                      const updated = [...configurations];
                      updated[indexOfFirstRecord + idx].isEditing = true;
                      setConfigurations(updated);
                    }}
                    color="primary"
                    aria-label="edit"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PumpConfigTable;