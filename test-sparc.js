#!/usr/bin/env node

/**
 * SPARC Methodology Test Script
 * Demonstrates the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology
 * integration with Vibex Task Manager
 */

import { TaskService } from './dist/src/services/task-service.js';
import { ConfigService } from './dist/src/services/config-service.js';
import BedrockClient from './dist/src/core/bedrock-client.js';
import { SparcService } from './dist/src/services/sparc-service.js';

async function testSparcMethodology() {
  console.log('🚀 Testing SPARC Methodology Integration\n');

  try {
    // Initialize services
    const projectRoot = process.cwd();
    const bedrockClient = new BedrockClient({ region: 'us-east-1' });
    const configService = new ConfigService(projectRoot);
    const taskService = new TaskService(projectRoot, bedrockClient, configService);
    const sparcService = new SparcService(bedrockClient, configService);

    // Create a test task
    console.log('📝 Creating test task for SPARC methodology...');
    const testTask = await taskService.createTask({
      title: 'SPARC Methodology Test Task',
      description: 'Testing the SPARC methodology integration with AI-powered task management',
      priority: 'high',
      status: 'pending',
    });

    console.log(`✓ Created task #${testTask.id}: ${testTask.title}\n`);

    // Enable SPARC methodology
    console.log('🔧 Enabling SPARC methodology...');
    const taskWithSparc = await taskService.enableSparcMethodology(testTask.id);
    console.log(`✓ SPARC enabled. Current phase: ${taskWithSparc.sparc?.currentPhase}\n`);

    // Generate requirements using AI
    console.log('📋 Generating SPARC requirements using Claude 4...');
    const requirements = await taskService.generateSparcRequirements(testTask.id);
    console.log('Generated Requirements:');
    requirements.forEach((req, index) => {
      console.log(`${index + 1}. ${req}`);
    });
    console.log('');

    // Advance to pseudocode phase
    console.log('🔄 Advancing to pseudocode phase...');
    await taskService.advanceSparcPhase(testTask.id, 'pseudocode');
    console.log('✓ Advanced to pseudocode phase\n');

    // Generate pseudocode using AI
    console.log('💻 Generating SPARC pseudocode using Claude 4...');
    const pseudocode = await taskService.generateSparcPseudocode(testTask.id);
    console.log('Agent Coordination:');
    console.log(pseudocode.coordination);
    console.log('\nTask Flow:');
    console.log(pseudocode.taskFlow);
    console.log('');

    // Advance to architecture phase
    console.log('🏗️ Advancing to architecture phase...');
    await taskService.advanceSparcPhase(testTask.id, 'architecture');
    console.log('✓ Advanced to architecture phase\n');

    // Generate architecture using AI
    console.log('🏛️ Generating SPARC architecture using Claude 4...');
    const architecture = await taskService.generateSparcArchitecture(testTask.id);
    console.log('Swarm Structure:');
    console.log(architecture.structure);
    console.log('\nAgent Roles:');
    architecture.roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.role}:`);
      role.responsibilities.forEach(resp => {
        console.log(`   - ${resp}`);
      });
    });
    console.log('');

    // Advance to refinement phase
    console.log('🔧 Advancing to refinement phase...');
    await taskService.advanceSparcPhase(testTask.id, 'refinement');
    console.log('✓ Advanced to refinement phase\n');

    // Generate test cases using AI
    console.log('🧪 Generating SPARC test cases using Claude 4...');
    const tests = await taskService.generateSparcTests(testTask.id);
    console.log('Generated Test Cases:');
    tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test}`);
    });
    console.log('');

    // Advance to completion phase
    console.log('✅ Advancing to completion phase...');
    await taskService.advanceSparcPhase(testTask.id, 'completion');
    console.log('✓ Advanced to completion phase\n');

    // Get SPARC progress
    console.log('📊 SPARC Progress Summary:');
    const progress = await taskService.getSparcProgress(testTask.id);
    console.log(`Current Phase: ${progress.currentPhase}`);
    console.log(`Progress: ${progress.progress.toFixed(1)}%`);
    console.log('');

    // Validate completion
    console.log('🔍 Validating SPARC completion...');
    const validation = await taskService.validateSparcCompletion(testTask.id);
    console.log(`Status: ${validation.isValid ? '✓ Valid' : '✗ Invalid'}`);
    
    if (validation.issues.length > 0) {
      console.log('\nIssues:');
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    console.log('\nTest Results:');
    validation.testResults.forEach(test => {
      const icon = test.status === 'pass' ? '✓' : test.status === 'fail' ? '✗' : '○';
      console.log(`  ${icon} ${test.testName}: ${test.status}`);
    });

    console.log('\n🎉 SPARC Methodology Test Completed Successfully!');
    console.log('\nSPARC Phases:');
    console.log('☐ SPECIFICATION: Define requirements for build/test fix swarm');
    console.log('☐ PSEUDOCODE: Design agent coordination and task flow');
    console.log('☐ ARCHITECTURE: Create swarm structure and agent roles');
    console.log('☐ REFINEMENT: Deploy agents with TDD approach');
    console.log('☐ COMPLETION: Validate build and all tests pass');

  } catch (error) {
    console.error('❌ Error testing SPARC methodology:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testSparcMethodology().catch(console.error); 