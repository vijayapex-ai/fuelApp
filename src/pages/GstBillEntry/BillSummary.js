import React from 'react';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography
} from '@mui/material';

const BillSummary = ({ taxSummary, isInterState }) => {
  return (
    <Table sx={{ mb: 4, border: '1px solid #e0e0e0' }}>
      <TableBody>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
            ₹{taxSummary.totalAmount}
          </TableCell>
        </TableRow>

        {!isInterState && (
          <>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>CGST</TableCell>
              <TableCell align="right">₹{taxSummary.cgst}</TableCell>
            </TableRow>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>SGST</TableCell>
              <TableCell align="right">₹{taxSummary.sgst}</TableCell>
            </TableRow>
          </>
        )}

        {isInterState && (
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>IGST</TableCell>
            <TableCell align="right">₹{taxSummary.igst}</TableCell>
          </TableRow>
        )}

        <TableRow sx={{ backgroundColor: '#eeeeee' }}>
          <TableCell sx={{ fontWeight: 'bold' }}>Total Tax</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
            ₹{(parseFloat(taxSummary.cgst) + parseFloat(taxSummary.sgst) + parseFloat(taxSummary.igst)).toFixed(2)}
          </TableCell>
        </TableRow>

        <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
          <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Grand Total
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}>
            ₹{taxSummary.grandTotal}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default BillSummary;