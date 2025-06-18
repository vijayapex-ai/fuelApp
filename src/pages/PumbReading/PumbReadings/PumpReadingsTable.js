import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField
} from '@mui/material';

const PumpReadingsTable = ({ 
  readings, 
  editMode, 
  isShiftClosed, 
  handleInputChange, 
  handleKeyDown 
}) => {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell>Pump Code</TableCell>
          <TableCell>Product Name</TableCell>
          <TableCell>Opening Reading</TableCell>
          <TableCell>Closing Reading</TableCell>
          <TableCell>Sale LTR</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {readings.map((r, index) => (
          <TableRow 
            key={r.pumpCode} 
            sx={{ 
              backgroundColor: r.status === 'closed' ? '#f9f9f9' : 'inherit',
              '&:hover': { backgroundColor: '#f0f0f0' }
            }}
          >
            <TableCell>{r.pumpCode}</TableCell>
            <TableCell>{r.productName}</TableCell>
            <TableCell>
              <TextField
                type="number"
                value={r.openingReading}
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </TableCell>
            <TableCell>
              <TextField
                type="number"
                value={r.closingReading}
                onChange={(e) => handleInputChange(index, 'closingReading', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={(r.status === 'closed' && !editMode) || (isShiftClosed && !editMode)}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  backgroundColor: editMode ? '#fffde7' : 'inherit',
                  '& .Mui-disabled': { backgroundColor: '#f5f5f5' }
                }}
              />
            </TableCell>
            <TableCell>{r.saleLTR}</TableCell>
            <TableCell>
              <span style={{ 
                color: r.status === 'closed' ? 'green' : 
                      r.status === 'edited' ? 'orange' : 'inherit',
                fontWeight: 'bold'
              }}>
                {r.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PumpReadingsTable;