#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = 'http://localhost:3000/api';

// Test user token - you'll need to replace this with a real token
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ Please set TEST_AUTH_TOKEN in your .env.local file');
  console.log('You can get a token by signing in and checking the network tab');
  process.exit(1);
}

async function testQuizGeneration() {
  console.log('\n🧪 Testing Quiz Generation...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        type: 'passage',
        difficulty: 'medium',
        questionCount: 5,
        reference: 'John 3:1-21'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Quiz generation failed:', data);
      return null;
    }

    console.log('✅ Quiz generated successfully!');
    console.log('Session ID:', data.sessionId);
    console.log('Questions:', data.questions.length);
    
    // Display questions
    data.questions.forEach((q: any, index: number) => {
      console.log(`\nQuestion ${index + 1}: ${q.question}`);
      if (q.options) {
        q.options.forEach((opt: string) => console.log(`  ${opt}`));
      }
    });

    return data;
  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    return null;
  }
}

async function testQuizSubmission(sessionId: string, questions: any[]) {
  console.log('\n🧪 Testing Quiz Submission...');
  
  // Create mock answers
  const answers = questions.map((q, index) => ({
    questionId: q.id,
    answer: q.type === 'multiple-choice' ? 'a' : 
            q.type === 'true-false' ? 'true' : 
            'test answer'
  }));

  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        sessionId,
        answers,
        timeSpent: 120 // 2 minutes
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Quiz submission failed:', data);
      return;
    }

    console.log('✅ Quiz submitted successfully!');
    console.log(`Score: ${data.score}/${data.maxScore}`);
    console.log(`Correct answers: ${data.correctAnswers}/${data.totalQuestions}`);
    
    if (data.newAchievements && data.newAchievements.length > 0) {
      console.log('\n🏆 New Achievements:');
      data.newAchievements.forEach((a: any) => {
        console.log(`  ${a.icon} ${a.name} - ${a.description}`);
      });
    }

    if (data.streakUpdate) {
      console.log(`\n🔥 Streak: ${data.streakUpdate.current} days`);
    }

    // Show detailed results
    console.log('\n📊 Detailed Results:');
    data.questions.forEach((q: any, index: number) => {
      console.log(`\nQuestion ${index + 1}: ${q.question}`);
      console.log(`Your answer: ${q.userAnswer}`);
      console.log(`Correct answer: ${q.correctAnswer}`);
      console.log(`Result: ${q.isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      if (q.explanation) {
        console.log(`Explanation: ${q.explanation}`);
      }
    });

  } catch (error) {
    console.error('❌ Error submitting quiz:', error);
  }
}

async function testQuizHistory() {
  console.log('\n🧪 Testing Quiz History...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed to fetch quiz history:', data);
      return;
    }

    console.log('✅ Quiz history fetched successfully!');
    console.log(`Found ${data.count} quizzes`);
    
    data.history.forEach((quiz: any, index: number) => {
      console.log(`\n${index + 1}. ${quiz.quizType} - ${quiz.difficulty}`);
      console.log(`   Score: ${quiz.score}/${quiz.maxScore}`);
      console.log(`   Date: ${new Date(quiz.timeCompleted).toLocaleString()}`);
      console.log(`   Duration: ${quiz.duration}s`);
    });

  } catch (error) {
    console.error('❌ Error fetching quiz history:', error);
  }
}

async function testQuizStats() {
  console.log('\n🧪 Testing Quiz Stats...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/stats`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed to fetch quiz stats:', data);
      return;
    }

    console.log('✅ Quiz stats fetched successfully!');
    const stats = data.stats;
    
    console.log('\n📈 Overall Statistics:');
    console.log(`Total Quizzes: ${stats.totalQuizzes}`);
    console.log(`Total Questions: ${stats.totalQuestions}`);
    console.log(`Correct Answers: ${stats.correctAnswers}`);
    console.log(`Accuracy: ${stats.totalQuestions > 0 ? 
      Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0}%`);
    console.log(`Current Streak: ${stats.currentStreak} days`);
    console.log(`Longest Streak: ${stats.longestStreak} days`);
    
    if (stats.achievements && stats.achievements.length > 0) {
      console.log('\n🏆 Achievements:');
      stats.achievements.forEach((a: any) => {
        console.log(`  ${a.icon} ${a.name} - ${a.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching quiz stats:', error);
  }
}

async function testLeaderboard() {
  console.log('\n🧪 Testing Leaderboard...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/leaderboard?type=all-time&limit=10`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Failed to fetch leaderboard:', data);
      return;
    }

    console.log('✅ Leaderboard fetched successfully!');
    console.log(`\n🏅 Top ${data.count} Players (All-Time):`);
    
    data.leaderboard.forEach((entry: any) => {
      console.log(`${entry.rank}. User ${entry.userId.substring(0, 8)}...`);
      console.log(`   Score: ${entry.score} | Quizzes: ${entry.quizCount} | Avg: ${entry.avgScore}%`);
    });

  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Quiz API Tests...');
  console.log('================================');

  // Test quiz generation
  const quizData = await testQuizGeneration();
  
  if (quizData && quizData.sessionId && quizData.questions) {
    // Test quiz submission
    await testQuizSubmission(quizData.sessionId, quizData.questions);
  }

  // Test quiz history
  await testQuizHistory();

  // Test quiz stats
  await testQuizStats();

  // Test leaderboard
  await testLeaderboard();

  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
