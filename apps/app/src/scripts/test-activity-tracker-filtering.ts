import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { activityService } from '@/lib/services/activity.service';
import { ActivityType } from '@/types/activity';
import { subDays, startOfYear, endOfYear, format } from 'date-fns';
import { getDatabase } from '@/lib/mongodb';

// Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const adminAuth = getAuth();

async function testActivityTrackerFiltering() {
  try {
    console.log('🧪 Testing Activity Tracker with Date Filtering...\n');

    // Get test user
    const testEmail = 'test@example.com';
    let user;
    
    try {
      user = await adminAuth.getUserByEmail(testEmail);
      console.log('✅ Found test user:', user.uid);
    } catch (error) {
      console.log('Creating test user...');
      user = await adminAuth.createUser({
        email: testEmail,
        password: 'testpassword123',
      });
      console.log('✅ Created test user:', user.uid);
    }

    // Create some test activities across different dates
    console.log('\n📝 Creating test activities...');
    
    const now = new Date();
    const activities = [
      // Activities from last year
      { date: subDays(now, 400), type: ActivityType.CHAPTER_READ, count: 2 },
      { date: subDays(now, 380), type: ActivityType.QUIZ_TAKEN, count: 1 },
      { date: subDays(now, 365), type: ActivityType.HIGHLIGHT_CREATED, count: 3 },
      
      // Activities from this year
      { date: subDays(now, 90), type: ActivityType.CHAPTER_READ, count: 1 },
      { date: subDays(now, 60), type: ActivityType.NOTE_CREATED, count: 2 },
      { date: subDays(now, 30), type: ActivityType.QUIZ_TAKEN, count: 1 },
      { date: subDays(now, 15), type: ActivityType.CHAPTER_READ, count: 3 },
      { date: subDays(now, 7), type: ActivityType.HIGHLIGHT_CREATED, count: 2 },
      { date: subDays(now, 2), type: ActivityType.CHAPTER_READ, count: 1 },
      { date: subDays(now, 1), type: ActivityType.QUIZ_PASSED, count: 1 },
      { date: now, type: ActivityType.CHAPTER_READ, count: 2 },
    ];

    // Log activities - we need to insert directly since logActivity doesn't accept timestamp
    const db = await getDatabase();
    const collection = db.collection('activities');
    
    for (const activity of activities) {
      for (let i = 0; i < activity.count; i++) {
        await collection.insertOne({
          userId: user.uid,
          type: activity.type,
          timestamp: activity.date,
          metadata: {
            test: true,
            date: format(activity.date, 'yyyy-MM-dd'),
          },
        });
      }
    }
    
    console.log('✅ Created test activities');

    // Test different date ranges
    console.log('\n📊 Testing date range queries...\n');

    // Test 1: Last 30 days
    console.log('1️⃣ Last 30 days:');
    const last30Days = await activityService.getContributionData(user.uid, 30);
    const last30DaysStats = await activityService.getActivityStatsByDateRange(
      user.uid,
      subDays(now, 30),
      now
    );
    console.log(`   - Days with activity: ${last30Days.filter(d => d.count > 0).length}`);
    console.log(`   - Total activities: ${last30DaysStats.totalActivities}`);
    console.log(`   - Current streak: ${last30DaysStats.currentStreak} days`);

    // Test 2: Last 90 days
    console.log('\n2️⃣ Last 90 days:');
    const last90Days = await activityService.getContributionData(user.uid, 90);
    const last90DaysStats = await activityService.getActivityStatsByDateRange(
      user.uid,
      subDays(now, 90),
      now
    );
    console.log(`   - Days with activity: ${last90Days.filter(d => d.count > 0).length}`);
    console.log(`   - Total activities: ${last90DaysStats.totalActivities}`);

    // Test 3: This year
    console.log('\n3️⃣ This year:');
    const thisYearStart = startOfYear(now);
    const thisYearEnd = now;
    const thisYearData = await activityService.getContributionDataByDateRange(
      user.uid,
      thisYearStart,
      thisYearEnd
    );
    const thisYearStats = await activityService.getActivityStatsByDateRange(
      user.uid,
      thisYearStart,
      thisYearEnd
    );
    console.log(`   - Days with activity: ${thisYearData.filter(d => d.count > 0).length}`);
    console.log(`   - Total activities: ${thisYearStats.totalActivities}`);
    console.log(`   - Activity breakdown:`, thisYearStats.activityBreakdown);

    // Test 4: All time
    console.log('\n4️⃣ All time:');
    const allTimeStats = await activityService.getActivityStats(user.uid);
    console.log(`   - Total activities: ${allTimeStats.totalActivities}`);
    console.log(`   - Active days: ${allTimeStats.activeDays}`);
    console.log(`   - Longest streak: ${allTimeStats.longestStreak} days`);

    // Test contribution graph data
    console.log('\n📈 Testing contribution graph data...');
    const contributionData = await activityService.getContributionData(user.uid, 365);
    const levelsCount = contributionData.reduce((acc, day) => {
      acc[day.level] = (acc[day.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log('   Activity levels distribution:');
    console.log(`   - Level 0 (no activity): ${levelsCount[0] || 0} days`);
    console.log(`   - Level 1 (low): ${levelsCount[1] || 0} days`);
    console.log(`   - Level 2 (medium): ${levelsCount[2] || 0} days`);
    console.log(`   - Level 3 (high): ${levelsCount[3] || 0} days`);
    console.log(`   - Level 4 (very high): ${levelsCount[4] || 0} days`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testActivityTrackerFiltering()
  .then(() => {
    console.log('\n👋 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
