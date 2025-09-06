import { TableData, TableConfig } from '@/types/chat';

// Test data with many columns to force horizontal scrolling
const testTableData: TableData = {
  headers: [
    'ID',
    'Employee Name',
    'Department',
    'Position',
    'Email Address',
    'Phone Number',
    'Hire Date',
    'Salary',
    'Performance Rating',
    'Manager',
    'Location',
    'Status'
  ],
  rows: [
    [
      1,
      'John Doe',
      'Engineering',
      'Senior Software Engineer',
      'john.doe@company.com',
      '+1-555-0123',
      '2020-01-15',
      '$120,000',
      'Excellent',
      'Jane Smith',
      'San Francisco, CA',
      'Active'
    ],
    [
      2,
      'Alice Johnson',
      'Marketing',
      'Marketing Manager',
      'alice.johnson@company.com',
      '+1-555-0124',
      '2019-03-22',
      '$95,000',
      'Very Good',
      'Bob Wilson',
      'New York, NY',
      'Active'
    ],
    [
      3,
      'Bob Williams',
      'Sales',
      'Sales Representative',
      'bob.williams@company.com',
      '+1-555-0125',
      '2021-06-10',
      '$75,000',
      'Good',
      'Carol Davis',
      'Chicago, IL',
      'Active'
    ],
    [
      4,
      'Emma Davis',
      'HR',
      'HR Specialist',
      'emma.davis@company.com',
      '+1-555-0126',
      '2020-09-01',
      '$65,000',
      'Very Good',
      'David Brown',
      'Austin, TX',
      'Active'
    ],
    [
      5,
      'Michael Brown',
      'Engineering',
      'DevOps Engineer',
      'michael.brown@company.com',
      '+1-555-0127',
      '2021-02-14',
      '$110,000',
      'Excellent',
      'Jane Smith',
      'San Francisco, CA',
      'Active'
    ]
  ]
};

const testTableConfig: TableConfig = {
  title: 'Employee Directory - Responsive Test',
  sortable: true,
  filterable: true,
  pagination: true,
  pageSize: 10,
  hoverable: true
};

// Test data with long text content
const longTextTableData: TableData = {
  headers: ['Title', 'Description', 'Category', 'Status'],
  rows: [
    [
      'Implement responsive table design',
      'This is a very long description that should wrap properly in table cells on smaller screens. The table should provide horizontal scrolling when needed but also allow text to wrap to prevent excessive horizontal expansion.',
      'Frontend Development',
      'In Progress'
    ],
    [
      'Add horizontal scrolling for tables',
      'Tables in the chat page responses should have horizontal scroll capability for responsive screens. This ensures that tables with many columns remain usable on mobile devices.',
      'UI/UX Enhancement',
      'Completed'
    ],
    [
      'Test table behavior on mobile',
      'Comprehensive testing of table rendering and scrolling behavior across different screen sizes and devices to ensure optimal user experience.',
      'Quality Assurance',
      'Pending'
    ]
  ]
};

const longTextTableConfig: TableConfig = {
  title: 'Task List - Text Wrapping Test',
  sortable: true,
  filterable: true,
  hoverable: true
};

console.log('Test Table Data for Responsive Scrolling:');
console.log('==========================================');
console.log('\n1. Wide Table with Many Columns:');
console.log(JSON.stringify({ data: testTableData, config: testTableConfig }, null, 2));
console.log('\n2. Table with Long Text Content:');
console.log(JSON.stringify({ data: longTextTableData, config: longTextTableConfig }, null, 2));

console.log('\n\nTo test responsive behavior:');
console.log('1. Use this data in a chat response');
console.log('2. Resize browser window to mobile size');
console.log('3. Verify horizontal scrolling works');
console.log('4. Verify text wraps appropriately in cells');
