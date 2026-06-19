#!/usr/bin/env node

/**
 * Verify Setup Script
 * 
 * Script untuk memverifikasi bahwa setup sudah benar sebelum menjalankan aplikasi
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, name) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${name} exists`, 'green');
    return true;
  } else {
    log(`❌ ${name} NOT FOUND`, 'red');
    return false;
  }
}

function checkEnvVariables() {
  log('\n📋 Checking Environment Variables...', 'cyan');
  
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file NOT FOUND', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  let allValid = true;

  for (const varName of requiredVars) {
    const regex = new RegExp(`${varName}=(.+)`, 'm');
    const match = envContent.match(regex);
    
    if (!match) {
      log(`❌ ${varName} not found in .env.local`, 'red');
      allValid = false;
    } else {
      const value = match[1].trim();
      if (value === '' || value.includes('your-') || value.includes('xxx')) {
        log(`⚠️  ${varName} not configured (still has placeholder value)`, 'yellow');
        allValid = false;
      } else {
        log(`✅ ${varName} is configured`, 'green');
      }
    }
  }

  return allValid;
}

function checkNodeModules() {
  log('\n📦 Checking Dependencies...', 'cyan');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  const packageJsonPath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(nodeModulesPath)) {
    log('❌ node_modules NOT FOUND', 'red');
    log('   Run: npm install', 'yellow');
    return false;
  }

  // Check if package.json is newer than node_modules
  const packageStats = fs.statSync(packageJsonPath);
  const nodeModulesStats = fs.statSync(nodeModulesPath);

  if (packageStats.mtime > nodeModulesStats.mtime) {
    log('⚠️  package.json is newer than node_modules', 'yellow');
    log('   Consider running: npm install', 'yellow');
    return false;
  }

  log('✅ node_modules exists and up to date', 'green');
  return true;
}

function checkSupabaseFiles() {
  log('\n🗄️  Checking Database Files...', 'cyan');
  return checkFile(path.join(__dirname, 'supabase-schema.sql'), 'supabase-schema.sql');
}

function checkPublicModels() {
  log('\n📸 Checking Face Recognition Models (Optional)...', 'cyan');
  const modelsPath = path.join(__dirname, 'public', 'models');
  
  if (!fs.existsSync(modelsPath)) {
    log('⚠️  public/models directory NOT FOUND', 'yellow');
    log('   This is optional. Face recognition will not work without models.', 'yellow');
    log('   See QUICKSTART.md for download instructions.', 'yellow');
    return false;
  }

  const requiredModels = [
    'tiny_face_detector_model-weights_manifest.json',
    'face_landmark_68_model-weights_manifest.json',
    'face_recognition_model-weights_manifest.json',
  ];

  let allPresent = true;
  for (const model of requiredModels) {
    const modelPath = path.join(modelsPath, model);
    if (!fs.existsSync(modelPath)) {
      log(`⚠️  ${model} NOT FOUND`, 'yellow');
      allPresent = false;
    }
  }

  if (allPresent) {
    log('✅ All face recognition models present', 'green');
  } else {
    log('⚠️  Some models missing (face recognition will not work)', 'yellow');
  }

  return allPresent;
}

function printSummary(results) {
  log('\n' + '='.repeat(60), 'blue');
  log('SETUP VERIFICATION SUMMARY', 'cyan');
  log('='.repeat(60), 'blue');

  const allPassed = Object.values(results).every(v => v === true);

  if (allPassed) {
    log('\n✅ ALL CHECKS PASSED!', 'green');
    log('\nYou can now run the application:', 'green');
    log('  npm run dev', 'cyan');
  } else {
    log('\n⚠️  SOME CHECKS FAILED', 'yellow');
    log('\nPlease fix the issues above before running the application.', 'yellow');
    
    if (!results.env) {
      log('\n📝 To fix environment variables:', 'cyan');
      log('   1. Open .env.local file', 'yellow');
      log('   2. Replace placeholder values with your Supabase credentials', 'yellow');
      log('   3. Get credentials from: https://app.supabase.com/project/_/settings/api', 'yellow');
    }

    if (!results.dependencies) {
      log('\n📦 To install dependencies:', 'cyan');
      log('   npm install', 'yellow');
    }

    log('\n📚 For detailed setup instructions, read:', 'cyan');
    log('   - START_HERE.md (quick overview)', 'yellow');
    log('   - QUICKSTART.md (5-minute setup)', 'yellow');
  }

  log('\n' + '='.repeat(60), 'blue');
}

// Main execution
function main() {
  log('🔍 Verifying Setup for Sistem Absensi Karyawan\n', 'cyan');

  const results = {
    files: checkFile(path.join(__dirname, '.env.local'), '.env.local'),
    env: checkEnvVariables(),
    dependencies: checkNodeModules(),
    database: checkSupabaseFiles(),
    models: checkPublicModels(),
  };

  printSummary(results);
}

main();
