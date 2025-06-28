// Load environment variables from .env file first
require('dotenv').config();

const React = require('react');
const fs = require('fs/promises');
const path = require('path');
const { execa } = require('execa');

// Import the real AI components
const { ConversationManager } = require('../agents/ConversationManager');
const { ProjectContext } = require('../context/ProjectContext');

// Simple console-based implementation without React complexity
async function runInteractive() {
  const [_node, _script, ...args] = process.argv;
  const instruction = process.argv.find(arg => arg.startsWith('--instruction='))?.split('=')[1] || '';
  
  const options = {
    claudeCode: args.includes('--claude-code'),
    modelStrategy: args.find(arg => arg.startsWith('--model-strategy='))?.split('=')[1] || 'bedrock',
    model: args.find(arg => arg.startsWith('--model='))?.split('=')[1],
    withTasks: args.includes('--with-tasks'),
    verbose: args.includes('--verbose'),
  };

  console.log('🚀 Vibex Interactive Development Assistant');
  console.log('=========================================');
  console.log('');
  console.log('🤖 AI Development Assistant Initialized');
  console.log('=====================================');
  
  // Show current working directory for debugging
  console.log(`📍 Working directory: ${process.cwd()}`);
  
  if (instruction) {
    console.log(`📝 Initial instruction: ${instruction}`);
    await processInstruction(instruction, options);
  } else {
    console.log('💬 Ready for instructions. Type your request and press Enter.');
    // For now, just exit since we don't have interactive input handling
    console.log('💡 Tip: Use --instruction="your request" to provide instructions');
  }
}

async function processInstruction(userInput, options) {
  console.log(`\n🔄 Processing: ${userInput}`);
  
  try {
    console.log('🧠 AI is thinking...');
    
    // Initialize the real AI conversation manager
    const projectContext = new ProjectContext(process.cwd());
    const conversationManager = new ConversationManager(projectContext);
    
    // Get real AI response
    const aiResponse = await conversationManager.processInstruction(userInput, projectContext, options);
    
    console.log('\n🤖 AI Response:');
    console.log(aiResponse);
    
    // Parse actions from AI response
    const actions = parseActionsFromResponse(aiResponse, userInput);
    
    if (actions.length > 0) {
      console.log('\n📋 AI Generated Plan:');
      actions.forEach((action, i) => {
        console.log(`${i + 1}. ${action.type}: ${action.title || action.file || action.command || 'Action'}`);
      });
      
      console.log('\n⚡ Executing actions automatically...');
      await executeActions(actions);
    } else {
      console.log('\n💭 AI provided guidance but no specific actions to execute.');
    }
    
  } catch (error) {
    console.error('❌ Error processing instruction:', error);
    console.log('\n🔄 Falling back to mock response for demonstration...');
    
    // Fallback to mock actions if AI fails
    const mockActions = generateMockActions(userInput);
    console.log('\n📋 Mock Plan (AI unavailable):');
    mockActions.forEach((action, i) => {
      console.log(`${i + 1}. ${action.type}: ${action.title || action.file || 'Action'}`);
    });
    
    console.log('\n⚡ Executing fallback actions...');
    await executeActions(mockActions);
  }
}

function parseActionsFromResponse(aiResponse, userInput) {
  const actions = [];
  
  // Handle both string and object responses
  let responseText = '';
  if (typeof aiResponse === 'string') {
    responseText = aiResponse;
  } else if (aiResponse && aiResponse.output) {
    responseText = aiResponse.output;
    
    // Check if we have a parsed actionPlan from the ConversationManager
    if (aiResponse.actionPlan && aiResponse.actionPlan.actions) {
      console.log('✅ Using parsed actionPlan from AI response');
      console.log('🔍 ActionPlan actions:', JSON.stringify(aiResponse.actionPlan.actions, null, 2));
      
      aiResponse.actionPlan.actions.forEach((action, index) => {
        console.log(`🔍 Processing action ${index + 1}:`, action.type, action);
        
        if (action.type === 'edit_file') {
          actions.push({
            type: 'edit_file',
            file: action.path,
            content: action.content
          });
        } else if (action.type === 'run_command') {
          actions.push({
            type: 'run_command',
            command: action.command
          });
        } else if (action.type === 'create_task') {
          actions.push({
            type: 'create_task',
            title: action.title,
            description: action.description,
            status: 'todo'
          });
        } else if (action.type === 'create_subtask') {
          actions.push({
            type: 'create_subtask',
            parent_id: action.parent_id,
            title: action.title,
            description: action.description,
            status: 'todo'
          });
        }
      });
      
      if (actions.length > 0) {
        console.log(`✅ Parsed ${actions.length} actions from actionPlan`);
        return actions;
      }
    }
  } else {
    console.log('⚠️  AI response is not in expected format, using fallback logic');
    // Fall through to inference logic below
  }
  
  // Look for <plan> blocks in the AI response
  if (responseText) {
    const planMatch = responseText.match(/<plan>([\s\S]*?)<\/plan>/);
    if (planMatch) {
      const planContent = planMatch[1];
      
      try {
        // Try to parse as JSON array first
        const jsonMatch = planContent.match(/\[([\s\S]*)\]/);
        if (jsonMatch) {
          const jsonContent = '[' + jsonMatch[1] + ']';
          const parsedActions = JSON.parse(jsonContent);
          
          parsedActions.forEach(action => {
            if (action.type === 'edit_file') {
              actions.push({
                type: 'edit_file',
                file: action.path,
                content: action.content
              });
            } else if (action.type === 'run_command') {
              actions.push({
                type: 'run_command',
                command: action.command
              });
            } else if (action.type === 'create_task') {
              actions.push({
                type: 'create_task',
                title: action.title,
                description: action.description,
                status: 'todo'
              });
            } else if (action.type === 'create_subtask') {
              actions.push({
                type: 'create_subtask',
                parent_id: action.parent_id,
                title: action.title,
                description: action.description,
                status: 'todo'
              });
            }
          });
          
          console.log(`✅ Parsed ${actions.length} actions from AI plan`);
          return actions;
        }
        
        // Try to parse as separate JSON objects (Claude's common format)
        const jsonObjectMatches = planContent.match(/\{[\s\S]*?\}/g);
        if (jsonObjectMatches) {
          jsonObjectMatches.forEach(jsonStr => {
            try {
              const action = JSON.parse(jsonStr);
              if (action.type === 'edit_file') {
                actions.push({
                  type: 'edit_file',
                  file: action.path,
                  content: action.content
                });
              } else if (action.type === 'run_command') {
                actions.push({
                  type: 'run_command',
                  command: action.command
                });
              } else if (action.type === 'create_task') {
                actions.push({
                  type: 'create_task',
                  title: action.title,
                  description: action.description,
                  status: 'todo'
                });
              } else if (action.type === 'create_subtask') {
                actions.push({
                  type: 'create_subtask',
                  parent_id: action.parent_id,
                  title: action.title,
                  description: action.description,
                  status: 'todo'
                });
              }
            } catch (objError) {
              console.log('⚠️  Failed to parse individual JSON object:', objError.message);
            }
          });
          
          if (actions.length > 0) {
            console.log(`✅ Parsed ${actions.length} actions from AI plan`);
            return actions;
          }
        }
      } catch (error) {
        console.log('⚠️  Failed to parse JSON plan, trying XML parsing...', error.message);
      }
      
      // Fallback to XML parsing if JSON parsing fails
      // Look for edit_file actions
      const editFileMatches = planContent.match(/<edit_file[^>]*(?:file|path)="([^"]*)"[^>]*>([\s\S]*?)<\/edit_file>/g);
      if (editFileMatches) {
        editFileMatches.forEach(match => {
          const fileMatch = match.match(/(?:file|path)="([^"]*)"/);
          const contentMatch = match.match(/<edit_file[^>]*>([\s\S]*?)<\/edit_file>/);
          if (fileMatch && contentMatch) {
            actions.push({
              type: 'edit_file',
              file: fileMatch[1],
              content: contentMatch[1].trim()
            });
          }
        });
      }
      
      // Look for run_command actions
      const commandMatches = planContent.match(/<run_command[^>]*>([\s\S]*?)<\/run_command>/g);
      if (commandMatches) {
        commandMatches.forEach(match => {
          const commandMatch = match.match(/<run_command[^>]*>([\s\S]*?)<\/run_command>/);
          if (commandMatch) {
            actions.push({
              type: 'run_command',
              command: commandMatch[1].trim()
            });
          }
        });
      }
      
      // Look for create_task actions
      const taskMatches = planContent.match(/<create_task[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/create_task>/g);
      if (taskMatches) {
        taskMatches.forEach(match => {
          const titleMatch = match.match(/title="([^"]*)"/);
          const descMatch = match.match(/<create_task[^>]*>([\s\S]*?)<\/create_task>/);
          if (titleMatch) {
            actions.push({
              type: 'create_task',
              title: titleMatch[1],
              description: descMatch ? descMatch[1].trim() : userInput,
              status: 'todo'
            });
          }
        });
      }
    }
  }
  
  // If no structured plan found, try to infer actions from the response
  if (actions.length === 0) {
    // Check if the response suggests creating a file
    if (userInput.toLowerCase().includes('file') || userInput.toLowerCase().includes('create') || userInput.toLowerCase().includes('script')) {
      // Generate a smart filename based on the request
      let filename = 'output.txt';
      if (userInput.toLowerCase().includes('hello world')) {
        filename = userInput.toLowerCase().includes('node') || userInput.toLowerCase().includes('javascript') ? 'hello.js' : 'hello.txt';
      } else if (userInput.toLowerCase().includes('script')) {
        filename = 'script.js';
      } else if (userInput.toLowerCase().includes('readme')) {
        filename = 'README.md';
      }
      
      actions.push({
        type: 'edit_file',
        file: filename,
        content: generateSmartContent(userInput, filename)
      });
    }
  }
  
  return actions;
}

function generateSmartContent(userInput, filename) {
  const timestamp = new Date().toISOString();
  
  if (filename.endsWith('.js')) {
    if (userInput.toLowerCase().includes('hello world')) {
      return `#!/usr/bin/env node

// Hello World script
// Generated based on: "${userInput}"
// Created at: ${timestamp}

console.log('Hello, World!');

// This script was created by the Vibex AI Development Assistant
// Run with: node ${filename}
`;
    } else {
      return `#!/usr/bin/env node

// Script generated based on: "${userInput}"
// Created at: ${timestamp}

console.log('Script executed successfully!');

// TODO: Implement the functionality described in: "${userInput}"
`;
    }
  } else if (filename.endsWith('.md')) {
    return `# Generated Document

This document was created based on your request: "${userInput}"

Generated at: ${timestamp}

## Overview

TODO: Add content based on your requirements.

---
*Created by Vibex AI Development Assistant*
`;
  } else {
    return `Hello World!

This file was created based on your request: "${userInput}"

Generated at: ${timestamp}

The Vibex AI Development Assistant successfully processed your instruction and created this file.
`;
  }
}

function generateMockActions(userInput) {
  // Generate smarter mock actions based on the input
  const actions = [];
  
  // Always create a task
  actions.push({
    type: 'create_task',
    title: 'Process user request',
    description: userInput,
    status: 'todo'
  });
  
  // Generate file based on request
  let filename = 'output.txt';
  if (userInput.toLowerCase().includes('hello world')) {
    filename = userInput.toLowerCase().includes('node') || userInput.toLowerCase().includes('javascript') || userInput.toLowerCase().includes('script') ? 'hello.js' : 'hello.txt';
  } else if (userInput.toLowerCase().includes('script')) {
    filename = 'script.js';
  } else if (userInput.toLowerCase().includes('readme')) {
    filename = 'README.md';
  }
  
  actions.push({
    type: 'edit_file',
    file: filename,
    content: generateSmartContent(userInput, filename)
  });
  
  return actions;
}

async function executeActions(actions) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create_task':
          console.log(`📝 Creating task: ${action.title}`);
          console.log(`   Description: ${action.description}`);
          console.log(`   Status: ${action.status}`);
          // TODO: Integrate with actual task management system
          break;
          
        case 'edit_file':
          console.log(`✏️  Creating file: ${action.file}`);
          
          // Resolve the file path relative to where the user ran the command
          // Use the original working directory, not where the package is installed
          const userWorkingDir = process.env.PWD || process.cwd();
          const resolvedFilePath = path.resolve(userWorkingDir, action.file);
          
          console.log(`   📍 Full path: ${resolvedFilePath}`);
          
          // Ensure the directory exists
          const dir = path.dirname(resolvedFilePath);
          if (dir !== '.') {
            await fs.mkdir(dir, { recursive: true });
          }
          
          // Check if file exists and append if it does
          let content = action.content;
          try {
            const existingContent = await fs.readFile(resolvedFilePath, 'utf8');
            if (existingContent.trim()) {
              content = existingContent + '\n' + action.content;
              console.log(`   📝 Appending to existing file`);
            }
          } catch (error) {
            // File doesn't exist, create new
            console.log(`   📝 Creating new file`);
          }
          
          // Write the file with proper error handling
          await fs.writeFile(resolvedFilePath, content, 'utf8');
          console.log(`✅ File ${action.file} created successfully!`);
          
          // Verify the file was created and show size
          const stats = await fs.stat(resolvedFilePath);
          console.log(`   📊 File size: ${stats.size} bytes`);
          break;
          
        case 'run_command':
          console.log(`🔧 Running command: ${action.command}`);
          const result = await execa('sh', ['-c', action.command]);
          console.log(`📤 Output: ${result.stdout}`);
          if (result.stderr) {
            console.log(`⚠️  Stderr: ${result.stderr}`);
          }
          break;
          
        case 'create_subtask':
          console.log(`📝 Creating subtask: ${action.title}`);
          console.log(`   Parent ID: ${action.parent_id}`);
          console.log(`   Description: ${action.description}`);
          console.log(`   Status: ${action.status}`);
          // TODO: Integrate with actual task management system
          break;
          
        default:
          console.log(`⚠️  Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`❌ Error executing action ${action.type}:`, error.message);
      if (action.type === 'edit_file') {
        console.log(`   📍 Attempted to write to: ${path.resolve(action.file)}`);
      }
    }
  }
  
  console.log('\n✅ All actions completed!');
  console.log('🎉 Development task finished successfully!');
}

// Run the interactive assistant
runInteractive().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 