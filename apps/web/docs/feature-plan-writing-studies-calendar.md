# Feature Plan: Writing Drawer, Bible Studies & God's Calendar

## Overview

This document outlines the implementation plan for three major features:
1. **Writing Drawer** - A rich text editor for notes, essays, and books
2. **Bible Study Plans** - Structured reading plans with character studies
3. **God's Calendar** - Biblical/Jewish calendar with holidays and observances

## Table of Contents

- [Feature Specifications](#feature-specifications)
- [Technical Architecture](#technical-architecture)
- [Implementation Roadmap](#implementation-roadmap)
- [API Design](#api-design)
- [Database Schema](#database-schema)
- [UI/UX Considerations](#uiux-considerations)
- [Progress Tracking](#progress-tracking)

---

## Feature Specifications

### 1. Writing Drawer System

#### Purpose
Enable users to create and manage written content while studying the Bible, including notes, essays, thesis papers, and books.

#### Key Features
- **Rich Text Editing**
  - Bold, italic, underline, strikethrough
  - Heading levels (H1-H6)
  - Font family and size selection
  - Lists (ordered/unordered)
  - Block quotes
  - Tables
  - Code blocks
  - Image insertion
  - Undo/redo functionality

- **Document Management**
  - Create, read, update, delete documents
  - Folder organization
  - Tagging system
  - Search functionality
  - Link documents to Bible verses
  - Version history

- **Export Options**
  - PDF export
  - DOCX export
  - Markdown export
  - HTML export

- **Integration Features**
  - "Expand to Document" from AI Insights
  - Auto-populate from AI-generated outlines
  - Cross-reference with Bible passages
  - Collaborative editing (future)

#### User Flow
1. User selects text in Bible reader
2. AI generates insights/outline
3. User clicks "Expand to Document"
4. Writing drawer opens with pre-populated content
5. User edits and formats content
6. Document auto-saves
7. User can export or share

### 2. Bible Study Plans

#### Purpose
Provide structured Bible reading experiences with various approaches including systematic plans, topical studies, book studies, and character studies.

#### Plan Categories

##### Systematic Reading Plans
- **Professor Grant Horner's Bible Reading System**
  - 10 chapters daily from different genres
  - Pentateuch, Historical, Wisdom, Prophets, Gospels, Epistles
- **One Year Bible**
- **Chronological Bible**
- **90-Day Bible Challenge**
- **Through the Bible in a Year**

##### Topical Studies
- Love
- Forgiveness
- Faith
- Prayer
- Hope
- Wisdom
- Spiritual Warfare
- Marriage & Family
- Leadership
- Suffering & Trials

##### Book Studies
- **Old Testament**: Genesis, Exodus, Psalms, Proverbs, Isaiah
- **New Testament**: Matthew, John, Acts, Romans, James, Revelation
- Verse-by-verse commentary structure
- Historical context
- Original language insights

##### Character Studies
- **Old Testament Characters**
  - Abraham - Father of Faith
  - Moses - The Deliverer
  - David - Man After God's Heart
  - Joseph - Dreamer and Leader
  - Daniel - Man of Excellence
  - Elijah - Prophet of Fire
  - Job - Patience in Suffering
  - Ruth - Loyalty and Love

- **New Testament Characters**
  - Peter - From Fisher to Apostle
  - Paul - Apostle to the Gentiles
  - John - The Beloved Disciple
  - Mary - Mother of Jesus
  - Timothy - Young Leader
  - Mary Magdalene - Transformed Life
  - Barnabas - Son of Encouragement

#### Features
- Progress tracking with visual indicators
- Daily reminders and notifications
- Note-taking for each day
- Highlight and bookmark functionality
- Share progress with community
- Completion certificates
- Reading streaks and achievements

### 3. God's Calendar

#### Purpose
Display biblical/Jewish calendar alongside Gregorian calendar with holidays, feasts, and observances.

#### Calendar Views
- **Hebrew/Jewish Calendar**
  - Hebrew months (Tishrei, Cheshvan, etc.)
  - Hebrew year display
  - Sabbath indicators
- **Gregorian Calendar**
  - Standard monthly view
  - Week and day views
- **Dual View**
  - Side-by-side comparison
  - Overlay mode
  - Date conversion tool

#### Events & Observances

##### Major Holidays
- **Rosh Hashanah** (Jewish New Year)
- **Yom Kippur** (Day of Atonement)
- **Sukkot** (Feast of Tabernacles)
- **Passover** (Pesach)
- **Shavuot** (Feast of Weeks)

##### Minor Holidays
- **Hanukkah** (Festival of Lights)
- **Purim** (Feast of Esther)
- **Tu BiShvat** (New Year of Trees)
- **Lag BaOmer**
- **Tisha B'Av** (Day of Mourning)

##### Weekly Observances
- Sabbath (Shabbat)
- Candle lighting times
- Havdalah times
- Torah portion of the week

##### Additional Features
- New moon indicators
- Biblical feast countdowns
- Location-based sunset times
- Holiday descriptions and traditions
- Biblical references for each observance
- Modern celebration guides

---

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Rich Text**: TipTap
- **Calendar**: @hebcal/core, custom components
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Export**: jsPDF, docx, markdown-pdf

### Component Architecture

```
src/
├── components/
│   ├── writing/
│   │   ├── WritingDrawer.tsx
│   │   ├── RichTextEditor.tsx
│   │   ├── DocumentList.tsx
│   │   ├── DocumentFolders.tsx
│   │   ├── ExportDialog.tsx
│   │   └── FormatToolbar.tsx
│   ├── study-plans/
│   │   ├── PlanCard.tsx
│   │   ├── PlanGrid.tsx
│   │   ├── PlanDetails.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── DailyReading.tsx
│   │   ├── CharacterProfile.tsx
│   │   └── StudyNotes.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── HebrewCalendar.tsx
│   │   ├── GregorianCalendar.tsx
│   │   ├── DualCalendar.tsx
│   │   ├── EventCard.tsx
│   │   ├── HolidayDetails.tsx
│   │   └── DateConverter.tsx
│   └── bible/
│       ├── FormattingControls.tsx
│       ├── VerseDisplay.tsx
│       └── ReadingProgress.tsx
├── contexts/
│   ├── WritingContext.tsx
│   ├── StudyPlanContext.tsx
│   └── CalendarContext.tsx
├── hooks/
│   ├── useDocument.ts
│   ├── useStudyPlan.ts
│   └── useHebrewDate.ts
└── lib/
    ├── services/
    │   ├── document.service.ts
    │   ├── study-plan.service.ts
    │   └── calendar.service.ts
    └── utils/
        ├── export.utils.ts
        ├── hebrew-date.utils.ts
        └── study-progress.utils.ts
```

### State Management

#### Writing Drawer State
```typescript
interface WritingState {
  isOpen: boolean;
  activeDocument: Document | null;
  documents: Document[];
  folders: Folder[];
  isAutoSaving: boolean;
  lastSaved: Date | null;
}
```

#### Study Plan State
```typescript
interface StudyPlanState {
  activePlan: StudyPlan | null;
  userProgress: UserProgress | null;
  availablePlans: StudyPlan[];
  dailyReading: DailyReading | null;
  streakCount: number;
}
```

#### Calendar State
```typescript
interface CalendarState {
  viewMode: 'hebrew' | 'gregorian' | 'dual';
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  userLocation: Coordinates | null;
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create feature branch
- [ ] Set up database schemas
- [ ] Create base API routes
- [ ] Update PanelContext for 3-panel support
- [ ] Basic writing drawer UI structure
- [ ] Install required dependencies

### Phase 2: Writing Features (Week 3-4)
- [ ] Integrate TipTap editor
- [ ] Implement document CRUD operations
- [ ] Add formatting toolbar
- [ ] Create document list view
- [ ] Implement auto-save functionality
- [ ] Add export functionality (PDF, DOCX)
- [ ] Create folder organization
- [ ] Link documents to Bible verses

### Phase 3: Study Plans (Week 5-6)
- [ ] Create study plan data structure
- [ ] Build plan selection page
- [ ] Implement daily reading view
- [ ] Add progress tracking
- [ ] Create character profile pages
- [ ] Build note-taking for studies
- [ ] Add reminder system
- [ ] Implement achievements/badges

### Phase 4: Calendar System (Week 7-8)
- [ ] Integrate Hebrew calendar library
- [ ] Create calendar UI components
- [ ] Build date conversion utilities
- [ ] Add holiday data
- [ ] Implement location-based times
- [ ] Create event detail views
- [ ] Add calendar toggle functionality
- [ ] Build Torah portion integration

### Phase 5: Bible Formatting (Week 9)
- [ ] Add verse number styling options
- [ ] Implement paragraph view toggle
- [ ] Create poetry formatting
- [ ] Add red letter edition
- [ ] Build footnote system
- [ ] Add print-friendly view

### Phase 6: Polish & Testing (Week 10)
- [ ] Cross-feature integration testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] User testing
- [ ] Bug fixes
- [ ] Documentation updates

---

## API Design

### Document Management APIs

#### Create Document
```
POST /api/documents
Body: {
  title: string
  content: string
  type: 'note' | 'essay' | 'thesis' | 'book'
  tags: string[]
  linkedVerses?: BibleReference[]
  folderId?: string
}
Response: Document
```

#### Get Documents
```
GET /api/documents
Query: {
  folderId?: string
  type?: string
  search?: string
  limit?: number
  offset?: number
}
Response: {
  documents: Document[]
  total: number
}
```

#### Update Document
```
PUT /api/documents/:id
Body: {
  title?: string
  content?: string
  tags?: string[]
  folderId?: string
}
Response: Document
```

#### Delete Document
```
DELETE /api/documents/:id
Response: { success: boolean }
```

#### Export Document
```
POST /api/documents/:id/export
Body: {
  format: 'pdf' | 'docx' | 'markdown' | 'html'
}
Response: { url: string }
```

### Study Plan APIs

#### Get Study Plans
```
GET /api/study-plans
Query: {
  category?: 'systematic' | 'topical' | 'book' | 'character'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}
Response: StudyPlan[]
```

#### Get Plan Details
```
GET /api/study-plans/:id
Response: StudyPlan
```

#### Start Study Plan
```
POST /api/study-plans/:id/start
Response: UserProgress
```

#### Update Progress
```
PUT /api/study-plans/:id/progress
Body: {
  day: number
  completed: boolean
  notes?: string
}
Response: UserProgress
```

#### Get User Progress
```
GET /api/study-plans/progress
Response: UserProgress[]
```

### Calendar APIs

#### Get Calendar Events
```
GET /api/calendar/events
Query: {
  startDate: string
  endDate: string
  type?: string[]
}
Response: CalendarEvent[]
```

#### Convert Date
```
POST /api/calendar/convert
Body: {
  date: string
  from: 'gregorian' | 'hebrew'
  to: 'gregorian' | 'hebrew'
}
Response: {
  gregorian: Date
  hebrew: HebrewDate
}
```

#### Get Location Times
```
GET /api/calendar/times
Query: {
  date: string
  latitude: number
  longitude: number
}
Response: {
  sunset: string
  candleLighting: string
  havdalah: string
}
```

---

## Database Schema

### MongoDB Collections

#### documents
```javascript
{
  _id: ObjectId,
  userId: String,
  title: String,
  content: String, // TipTap JSON
  type: String, // 'note' | 'essay' | 'thesis' | 'book'
  tags: [String],
  linkedVerses: [{
    book: String,
    chapter: Number,
    verse: Number
  }],
  folderId: ObjectId,
  version: Number,
  versions: [{
    content: String,
    savedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### folders
```javascript
{
  _id: ObjectId,
  userId: String,
  name: String,
  parentId: ObjectId,
  color: String,
  icon: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### study_plans
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  difficulty: String,
  duration: Number, // days
  author: String,
  dailyReadings: [{
    day: Number,
    title: String,
    passages: [{
      book: String,
      startChapter: Number,
      startVerse: Number,
      endChapter: Number,
      endVerse: Number
    }],
    devotional: String,
    questions: [String],
    keyVerse: {
      book: String,
      chapter: Number,
      verse: Number
    },
    prayerFocus: String
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### user_progress
```javascript
{
  _id: ObjectId,
  userId: String,
  planId: ObjectId,
  startDate: Date,
  completedDays: [Number],
  currentDay: Number,
  currentStreak: Number,
  longestStreak: Number,
  notes: {
    [day: Number]: String
  },
  highlights: {
    [verseId: String]: String // color
  },
  bookmarks: [{
    book: String,
    chapter: Number,
    verse: Number
  }],
  lastAccessedAt: Date,
  completedAt: Date
}
```

#### calendar_events
```javascript
{
  _id: ObjectId,
  name: {
    english: String,
    hebrew: String,
    transliteration: String
  },
  type: String, // 'major-holiday' | 'minor-holiday' | 'fast' | 'feast' | 'sabbath'
  startDate: Date,
  endDate: Date,
  hebrewDate: {
    year: Number,
    month: String,
    day: Number
  },
  description: String,
  biblicalReferences: [String],
  traditions: [String],
  modernObservance: String,
  recurring: {
    type: String, // 'yearly' | 'monthly' | 'weekly'
    rule: String
  }
}
```

---

## UI/UX Considerations

### Writing Drawer
- **Position**: Right side overlay or push content
- **Width**: 600px default, resizable
- **Mobile**: Full screen modal
- **Auto-save**: Every 30 seconds
- **Keyboard shortcuts**: Standard (Ctrl+B, Ctrl+I, etc.)

### Study Plans
- **Card layout**: Grid view with images
- **Progress indicators**: Visual progress bars
- **Daily view**: Clean, focused reading experience
- **Mobile**: Swipe between days

### Calendar
- **Default view**: Current month
- **Touch gestures**: Swipe to change months
- **Event indicators**: Colored dots
- **Quick view**: Tap for event summary
- **Full view**: Detailed event page

### Accessibility
- **Keyboard navigation**: Full support
- **Screen readers**: ARIA labels
- **High contrast**: Theme option
- **Font scaling**: Respect user preferences
- **Focus indicators**: Clear and visible

### Performance
- **Lazy loading**: Documents and plans
- **Pagination**: Large lists
- **Caching**: Calendar events
- **Optimistic updates**: UI responsiveness
- **Code splitting**: Route-based

---

## Progress Tracking

### Completed Tasks
- [x] Create feature branch
- [x] Create comprehensive documentation

### Current Sprint (Week 1-2)
- [ ] Set up MongoDB schemas
- [ ] Create API route structure
- [ ] Update PanelContext
- [ ] Basic writing drawer UI

### Upcoming Milestones
- [ ] Writing drawer MVP (Week 4)
- [ ] Study plans MVP (Week 6)
- [ ] Calendar MVP (Week 8)
- [ ] Beta release (Week 10)

### Risk Factors
1. **TipTap complexity** - May need extra time for rich text features
2. **Hebrew calendar accuracy** - Requires thorough testing
3. **Performance with large documents** - Need optimization strategy
4. **Mobile responsiveness** - Complex layouts need careful design

### Success Metrics
- [ ] 90% test coverage
- [ ] < 3s page load time
- [ ] Mobile-first responsive design
- [ ] Accessibility score > 95
- [ ] User satisfaction > 4.5/5

---

## Notes & Decisions

### Design Decisions
- Using TipTap over other editors for better React integration
- MongoDB for flexible document structure
- Client-side Hebrew date calculations for performance

### Future Enhancements
- Collaborative editing
- AI-powered study plan recommendations
- Social features (share progress, discussions)
- Offline support with sync
- Multi-language support

### Dependencies to Add
```json
{
  "@tiptap/react": "^2.1.13",
  "@tiptap/starter-kit": "^2.1.13",
  "@tiptap/extension-table": "^2.1.13",
  "@tiptap/extension-image": "^2.1.13",
  "@hebcal/core": "^3.45.0",
  "date-fns": "^2.30.0",
  "jspdf": "^2.5.1",
  "docx": "^8.2.4",
  "markdown-pdf": "^11.0.0"
}
```

---

Last Updated: January 24, 2025
