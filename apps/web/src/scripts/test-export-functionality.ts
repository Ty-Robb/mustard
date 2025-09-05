import { exportService } from '@/lib/services/export.service';
import { activityService } from '@/lib/services/activity.service';
import { ExportType, ExportFormat, ExportStatus } from '@/types/export';
import { ActivityType } from '@/types/activity';
import { getDatabase } from '@/lib/mongodb';

async function testExportFunctionality() {
  console.log('🧪 Testing Export Functionality...\n');

  const testUserId = 'test-user-123';

  try {
    // 1. First, create some test activity data
    console.log('1️⃣ Creating test activity data...');
    
    const activities = [
      {
        userId: testUserId,
        type: ActivityType.CHAPTER_READ,
        metadata: {
          title: 'Genesis Chapter 1',
          description: 'Read the creation story',
        },
      },
      {
        userId: testUserId,
        type: ActivityType.QUIZ_TAKEN,
        metadata: {
          title: 'Bible Basics Quiz',
          description: 'Score: 85%',
        },
      },
      {
        userId: testUserId,
        type: ActivityType.COURSE_STARTED,
        metadata: {
          title: 'Introduction to Old Testament',
          description: 'Started learning journey',
        },
      },
    ];

    for (const activity of activities) {
      await activityService.logActivity(activity);
    }
    console.log('✅ Test activities created\n');

    // 2. Test creating export jobs for different types and formats
    console.log('2️⃣ Testing export job creation...\n');

    const exportTests = [
      {
        type: ExportType.ACTIVITY_HISTORY,
        format: ExportFormat.JSON,
        name: 'Activity History (JSON)',
      },
      {
        type: ExportType.ACTIVITY_HISTORY,
        format: ExportFormat.CSV,
        name: 'Activity History (CSV)',
      },
      {
        type: ExportType.ACTIVITY_STATS,
        format: ExportFormat.JSON,
        name: 'Activity Stats (JSON)',
      },
      {
        type: ExportType.CONTRIBUTION_GRAPH,
        format: ExportFormat.CSV,
        name: 'Contribution Graph (CSV)',
      },
    ];

    for (const test of exportTests) {
      console.log(`📦 Creating export: ${test.name}`);
      
      const job = await exportService.createExportJob({
        userId: testUserId,
        type: test.type,
        format: test.format,
      });

      console.log(`   Job ID: ${job.id}`);
      console.log(`   Status: ${job.status}`);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check job status
      const updatedJob = await exportService.getExportJob(job.id, testUserId);
      
      if (updatedJob) {
        console.log(`   Final Status: ${updatedJob.status}`);
        
        if (updatedJob.status === ExportStatus.COMPLETED) {
          console.log(`   ✅ Export completed successfully`);
          if (updatedJob.metadata) {
            console.log(`   Records: ${updatedJob.metadata.recordCount}`);
            if (updatedJob.metadata.fileSize) {
              console.log(`   File Size: ${(updatedJob.metadata.fileSize / 1024).toFixed(2)} KB`);
            }
          }
        } else if (updatedJob.status === ExportStatus.FAILED) {
          console.log(`   ❌ Export failed: ${updatedJob.error}`);
        }
      }
      
      console.log('');
    }

    // 3. Test fetching user's export jobs
    console.log('3️⃣ Testing export job listing...');
    const userJobs = await exportService.getUserExportJobs(testUserId);
    console.log(`Found ${userJobs.length} export jobs for user\n`);

    // 4. Display sample export content
    console.log('4️⃣ Sample export content:\n');
    
    const sampleJob = userJobs.find(
      job => job.type === ExportType.ACTIVITY_HISTORY && 
             job.format === ExportFormat.CSV &&
             job.status === ExportStatus.COMPLETED
    );
    
    if (sampleJob && sampleJob.downloadUrl) {
      // Extract content from data URL
      const base64Data = sampleJob.downloadUrl.split(',')[1];
      const content = Buffer.from(base64Data, 'base64').toString('utf-8');
      
      console.log('CSV Export Sample:');
      console.log('─'.repeat(50));
      console.log(content.split('\n').slice(0, 5).join('\n'));
      console.log('─'.repeat(50));
    }

    // 5. Clean up test data
    console.log('\n5️⃣ Cleaning up test data...');
    const db = await getDatabase();
    
    // Clean up activities
    await db.collection('activities').deleteMany({ userId: testUserId });
    
    // Clean up export jobs
    await db.collection('exportJobs').deleteMany({ userId: testUserId });
    
    console.log('✅ Test data cleaned up');

    console.log('\n✨ Export functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testExportFunctionality()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
