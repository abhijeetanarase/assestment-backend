import csv from 'csvtojson';
import * as XLSX from 'xlsx';
import { Express } from 'express';

export const parseFileBuffer = async (file: Express.Multer.File): Promise<any[]> => {
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const csvStr = file.buffer.toString('utf8');
    return await csv().fromString(csvStr);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  throw new Error('Unsupported file type. Please upload a CSV or XLSX file.');
};
