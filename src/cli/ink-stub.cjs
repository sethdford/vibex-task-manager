// Simple stub for ink components to avoid module compatibility issues
const React = require('react');

// Basic Box component - just renders children
const Box = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

// Basic Text component - just renders text
const Text = ({ children, ...props }) => {
  return React.createElement('span', props, children);
};

// Stub useInput hook
const useInput = (inputHandler) => {
  React.useEffect(() => {
    const handleKeyPress = (key) => {
      if (inputHandler) {
        inputHandler(key, { key });
      }
    };

    // Setup basic stdin handling for key presses
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key) => {
      // Handle basic key presses
      if (key === '\u0003') { // Ctrl+C
        process.exit();
      }
      handleKeyPress(key, { key });
    });
    
    return () => {
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
    };
  }, [inputHandler]);
};

// Basic render function - provides a simple console-based interface
const render = (element) => {
  console.log('🚀 Vibex Interactive Development Assistant');
  console.log('=========================================');
  console.log('');
  
  // For now, we'll just provide a basic console interface
  // In a real terminal UI, this would render the React component
  
  return {
    rerender: () => {},
    unmount: () => {},
    waitUntilExit: () => {
      return new Promise((resolve) => {
        // Simple console-based interaction
        console.log('Press Ctrl+C to exit');
        
        process.on('SIGINT', () => {
          console.log('\nExiting...');
          resolve();
        });
      });
    },
    cleanup: () => {},
    clear: () => console.clear()
  };
};

module.exports = {
  Box,
  Text,
  useInput,
  render
}; 