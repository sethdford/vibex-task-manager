import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

const Spinner = require('ink-spinner').default;
const TextInput = require('ink-text-input').default;

// Note: These imports are now relative to the new execution context
import { ConversationManager } from '../../agents/ConversationManager.js';
import { ProjectContext } from '../../context/ProjectContext.js';

const DevInterface = ({ instruction, options }) => {
  const [conversation, setConversation] = useState([]);
  const [query, setQuery] = useState(instruction || '');
  const [isLoading, setIsLoading] = useState(false);
  const [manager] = useState(new ConversationManager(options));
  const [projectContext] = useState(new ProjectContext());

  const addMessage = (role, content) => {
    setConversation(prev => [...prev, { role, content }]);
  };

  const handleQuery = async (q) => {
    if (!q || q.trim() === '' || isLoading) return;

    addMessage('user', q);
    setIsLoading(true);

    try {
      const response = await manager.processInstruction(q, projectContext, options);
      addMessage('assistant', response.output);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('assistant', `Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  useEffect(() => {
    // Initialize project context and process initial instruction if provided
    const init = async () => {
      await projectContext.initialize(process.cwd());
      if (instruction) {
        await handleQuery(instruction);
      }
    };
    init();
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        {conversation.map((msg, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Text color={msg.role === 'user' ? 'cyan' : 'green'} bold>
              {msg.role === 'user' ? 'You' : 'Vibex'}
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}
      </Box>

      {isLoading && (
        <Box>
          <Text color="yellow">
            <Spinner type="dots" /> Thinking...
          </Text>
        </Box>
      )}

      {!isLoading && (
        <Box>
          <Box marginRight={1}>
            <Text>›</Text>
          </Box>
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={handleQuery}
            placeholder="Ask a follow-up or type your next command..."
          />
        </Box>
      )}
    </Box>
  );
};

export default DevInterface; 