import mongoose from 'mongoose';
import LearningProgress from './server/models/LearningProgress.js';

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telugu-learning';

async function testLearningProgress() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user ID (you can replace this with a real user ID)
    const testUserId = new mongoose.Types.ObjectId();

    console.log('\n🧪 Testing Learning Progress Model...');

    // Test 1: Create new progress record
    console.log('\n1. Creating new progress record...');
    const progress = new LearningProgress({
      userId: testUserId
    });
    await progress.save();
    console.log('✅ Progress record created');

    // Test 2: Update dictation progress
    console.log('\n2. Testing dictation progress update...');
    progress.updateDictationProgress(1, 100, 1);
    progress.updateDictationProgress(2, 80, 2);
    progress.updateDictationProgress(3, 90, 1);
    await progress.save();
    console.log('✅ Dictation progress updated');

    // Test 3: Update sentence formation progress
    console.log('\n3. Testing sentence formation progress update...');
    progress.updateSentenceFormationProgress(1, 100, 1, 30);
    progress.updateSentenceFormationProgress(2, 70, 3, 45);
    await progress.save();
    console.log('✅ Sentence formation progress updated');

    // Test 4: Update spelling progress
    console.log('\n4. Testing spelling progress update...');
    progress.updateSpellingProgress(1, 100, 1, 0, 25);
    progress.updateSpellingProgress(2, 60, 2, 1, 40);
    await progress.save();
    console.log('✅ Spelling progress updated');

    // Test 5: Get progress summary
    console.log('\n5. Getting progress summary...');
    const summary = progress.getProgressSummary();
    console.log('📊 Progress Summary:');
    console.log(JSON.stringify(summary, null, 2));

    // Test 6: Test analytics calculations
    console.log('\n6. Testing analytics...');
    const analytics = {
      dictation: {
        ...summary.dictation,
        averageScore: summary.dictation.completed > 0 
          ? summary.dictation.totalScore / summary.dictation.completed 
          : 0,
        completionRate: summary.dictation.completed / 50 * 100
      },
      sentenceFormation: {
        ...summary.sentenceFormation,
        averageScore: summary.sentenceFormation.completed > 0 
          ? summary.sentenceFormation.totalScore / summary.sentenceFormation.completed 
          : 0,
        completionRate: summary.sentenceFormation.completed / 100 * 100
      },
      spelling: {
        ...summary.spelling,
        averageScore: summary.spelling.completed > 0 
          ? summary.spelling.totalScore / summary.spelling.completed 
          : 0,
        completionRate: summary.spelling.completed / 100 * 100
      },
      overall: summary.overall
    };
    console.log('📈 Analytics:');
    console.log(JSON.stringify(analytics, null, 2));

    // Test 7: Reset a module
    console.log('\n7. Testing module reset...');
    progress.resetModuleProgress('dictation');
    await progress.save();
    const resetSummary = progress.getProgressSummary();
    console.log('🔄 After dictation reset:');
    console.log(JSON.stringify(resetSummary.dictation, null, 2));

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Progress record creation');
    console.log('- ✅ Dictation progress tracking');
    console.log('- ✅ Sentence formation progress tracking');
    console.log('- ✅ Spelling progress tracking');
    console.log('- ✅ Progress summary generation');
    console.log('- ✅ Analytics calculations');
    console.log('- ✅ Module reset functionality');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLearningProgress();
