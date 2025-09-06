import { TableData, TableConfig } from '@/types/chat';

// Create sample table data with many columns to test horizontal scrolling
const sampleTableData: TableData = {
  headers: [
    'ID',
    'Name',
    'Email Address',
    'Phone Number',
    'Department',
    'Position',
    'Start Date',
    'Salary',
    'Location',
    'Status',
    'Manager',
    'Projects'
  ],
  rows: [
    [
      1,
      'John Doe',
      'john.doe@example.com',
      '+1-555-123-4567',
      'Engineering',
      'Senior Developer',
      '2020-01-15',
      '$120,000',
      'San Francisco, CA',
      'Active',
      'Jane Smith',
      'Project Alpha, Project Beta'
    ],
    [
      2,
      'Jane Smith',
      'jane.smith@example.com',
      '+1-555-234-5678',
      'Engineering',
      'Engineering Manager',
      '2018-06-01',
      '$150,000',
      'New York, NY',
      'Active',
      'Bob Johnson',
      'Project Gamma, Project Delta'
    ],
    [
      3,
      'Bob Johnson',
      'bob.johnson@example.com',
      '+1-555-345-6789',
      'Product',
      'VP of Product',
      '2017-03-20',
      '$180,000',
      'Austin, TX',
      'Active',
      'CEO',
      'All Projects'
    ],
    [
      4,
      'Alice Williams',
      'alice.williams@example.com',
      '+1-555-456-7890',
      'Marketing',
      'Marketing Specialist',
      '2021-09-10',
      '$85,000',
      'Chicago, IL',
      'Active',
      'Charlie Brown',
      'Marketing Campaign 2024'
    ],
    [
      5,
      'Charlie Brown',
      'charlie.brown@example.com',
      '+1-555-567-8901',
      'Marketing',
      'Marketing Director',
      '2019-11-05',
      '$130,000',
      'Boston, MA',
      'Active',
      'Bob Johnson',
      'Brand Strategy, Digital Marketing'
    ]
  ]
};

const tableConfig: TableConfig = {
  title: 'Employee Directory',
  sortable: true,
  filterable: true,
  pagination: true,
  pageSize: 10,
  hoverable: true
};

console.log('Sample Table Data for Testing Horizontal Scroll:');
console.log('================================================');
console.log('Headers:', sampleTableData.headers.length, 'columns');
console.log('Rows:', sampleTableData.rows.length, 'rows');
console.log('\nTable Configuration:');
console.log(JSON.stringify(tableConfig, null, 2));
console.log('\nThis table should demonstrate horizontal scrolling on mobile devices');
console.log('due to the large number of columns that exceed typical screen widths.');
