'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TableData, TableConfig } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface TableRendererProps {
  data: TableData;
  config?: TableConfig | null;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function TableRenderer({ data, config, className }: TableRendererProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Validate data structure
  if (!data || !data.headers || !data.rows) {
    console.error('[TableRenderer] Invalid data structure:', data);
    return (
      <div className={cn(
        "max-w-full overflow-hidden rounded-xl",
        "bg-destructive/10 backdrop-blur-sm",
        "border border-destructive/50",
        "shadow-lg p-6",
        className
      )}>
        <p className="text-destructive text-center">
          Invalid table data: Missing headers or rows
        </p>
      </div>
    );
  }

  // Provide default config if not provided
  const safeConfig = config || {};
  const pageSize = safeConfig.pagination ? (safeConfig.pageSize || 10) : (data.rows?.length || 0);

  // Filter rows based on search value
  const filteredRows = useMemo(() => {
    if (!safeConfig.filterable || !filterValue) return data.rows;

    return data.rows.filter(row =>
      row.some(cell =>
        cell.toString().toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  }, [data.rows, filterValue, safeConfig.filterable]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!safeConfig.sortable || sortColumn === null || sortDirection === null) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = aVal.toString();
      const bStr = bVal.toString();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredRows, sortColumn, sortDirection, safeConfig.sortable]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    if (!safeConfig.pagination) return sortedRows;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, currentPage, pageSize, safeConfig.pagination]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const handleSort = (columnIndex: number) => {
    if (!safeConfig.sortable) return;

    if (sortColumn === columnIndex) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnIndex: number) => {
    if (!safeConfig.sortable || sortColumn !== columnIndex) return null;

    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 ml-1 inline" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown className="h-4 w-4 ml-1 inline" />;
    }
    return null;
  };

  return (
    <div className={cn(
      "max-w-full overflow-hidden rounded-xl",
      "bg-card/50 backdrop-blur-sm",
      "border border-border/50",
      "shadow-lg",
      className
    )}>
      {safeConfig.title && (
        <div className="pb-3 px-6 pt-5">
          <h3 className="text-lg font-semibold text-card-foreground">{safeConfig.title}</h3>
          <div className="mt-2 border-b border-border/30" />
        </div>
      )}
      <div className="p-6 pt-2">
        {safeConfig.filterable && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search table..."
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter
                }}
                className="pl-8 bg-muted/50 border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>
        )}

        <div className="rounded-lg bg-card/30 backdrop-blur-sm p-4 border border-border/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {data.headers.map((header, index) => (
                  <TableHead
                    key={index}
                    className={cn(
                      "text-muted-foreground",
                      safeConfig.sortable ? 'cursor-pointer select-none' : ''
                    )}
                    onClick={() => handleSort(index)}
                  >
                    {header}
                    {getSortIcon(index)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={
                      safeConfig.hoverable !== false ? 'hover:bg-muted/50' : ''
                    }
                  >
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="text-foreground">
                        {typeof cell === 'boolean' ? (
                          cell ? '✓' : '✗'
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={data.headers.length}
                    className="text-center text-muted-foreground py-8"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {data.footer && (
              <TableFooter>
                <TableRow>
                  {data.footer.map((cell, index) => (
                    <TableCell key={index} className="font-medium text-foreground">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        {safeConfig.pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedRows.length)} of{' '}
              {sortedRows.length} rows
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
