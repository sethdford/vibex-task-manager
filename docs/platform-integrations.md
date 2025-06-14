# Platform-Specific Integrations

Advanced integration examples for mobile, desktop, cloud, and enterprise platforms using Vibex Task Manager APIs.

## Table of Contents

- [Mobile Development](#mobile-development)
- [Desktop Applications](#desktop-applications)
- [Cloud Platform Integrations](#cloud-platform-integrations)
- [Enterprise Solutions](#enterprise-solutions)
- [IoT and Edge Computing](#iot-and-edge-computing)
- [Real-Time Collaboration](#real-time-collaboration)

---

## Mobile Development

### React Native Integration

#### Task Manager Mobile App

```typescript
// TaskManagerApp.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus, Priority } from 'vibex-task-manager/types';

interface VibexMobileClient {
  baseUrl: string;
  apiKey?: string;
}

class VibexClient {
  private config: VibexMobileClient;

  constructor(config: VibexMobileClient) {
    this.config = config;
  }

  async getTasks(filter?: { status?: TaskStatus; priority?: Priority }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.priority) params.append('priority', filter.priority);

    const response = await fetch(`${this.config.baseUrl}/api/tasks?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks;
  }

  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    const response = await fetch(`${this.config.baseUrl}/api/tasks/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.task;
  }

  async addTask(task: Omit<Task, 'id'>): Promise<Task> {
    const response = await fetch(`${this.config.baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.task;
  }

  async getNextTask(): Promise<Task | null> {
    const response = await fetch(`${this.config.baseUrl}/api/tasks/next`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.task || null;
  }
}

const TaskManagerApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<{ status?: TaskStatus; priority?: Priority }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [client, setClient] = useState<VibexClient | null>(null);

  useEffect(() => {
    initializeClient();
  }, []);

  useEffect(() => {
    if (client) {
      loadTasks();
    }
  }, [client, filter]);

  const initializeClient = async () => {
    try {
      const baseUrl = await AsyncStorage.getItem('vibex_base_url');
      const apiKey = await AsyncStorage.getItem('vibex_api_key');
      
      if (baseUrl) {
        const vibexClient = new VibexClient({ baseUrl, apiKey: apiKey || undefined });
        setClient(vibexClient);
      } else {
        // Show configuration screen
        Alert.alert('Configuration Required', 'Please configure your Vibex server URL');
      }
    } catch (error) {
      console.error('Failed to initialize client:', error);
    }
  };

  const loadTasks = async () => {
    if (!client) return;

    try {
      setLoading(true);
      const fetchedTasks = await client.getTasks(filter);
      setTasks(fetchedTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
      console.error('Load tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    if (!client) return;

    try {
      await client.updateTaskStatus(taskId, status);
      await loadTasks(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
      console.error('Update status error:', error);
    }
  };

  const addTask = async () => {
    if (!client || !newTaskTitle.trim()) return;

    try {
      await client.addTask({
        title: newTaskTitle,
        description: newTaskDescription,
        status: 'pending',
        priority: 'medium',
        dependencies: [],
      });

      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddModal(false);
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
      console.error('Add task error:', error);
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    const colors = {
      pending: '#6B7280',
      'in-progress': '#3B82F6',
      done: '#10B981',
      review: '#F59E0B',
      deferred: '#8B5CF6',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getPriorityIcon = (priority: Priority): string => {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    };
    return icons[priority];
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {getPriorityIcon(item.priority)} {item.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      {item.dependencies.length > 0 && (
        <Text style={styles.dependencies}>
          Depends on: {item.dependencies.join(', ')}
        </Text>
      )}
      
      <View style={styles.taskActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => updateTaskStatus(item.id, 'in-progress')}
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'in-progress' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => updateTaskStatus(item.id, 'done')}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => {
            // Navigate to task details screen
            Alert.alert('Task Details', `ID: ${item.id}\n\n${item.description}`);
          }}
        >
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter.status === 'pending' && styles.activeFilter]}
          onPress={() => setFilter({ ...filter, status: filter.status === 'pending' ? undefined : 'pending' })}
        >
          <Text style={styles.filterText}>Pending</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter.status === 'in-progress' && styles.activeFilter]}
          onPress={() => setFilter({ ...filter, status: filter.status === 'in-progress' ? undefined : 'in-progress' })}
        >
          <Text style={styles.filterText}>In Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter.status === 'done' && styles.activeFilter]}
          onPress={() => setFilter({ ...filter, status: filter.status === 'done' ? undefined : 'done' })}
        >
          <Text style={styles.filterText}>Done</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TouchableOpacity onPress={addTask}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Task title"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Task description"
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#4B5563',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  dependencies: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  detailsButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});

export default TaskManagerApp;
```

#### Background Sync Service

```typescript
// BackgroundTaskSync.ts
import BackgroundJob from 'react-native-background-job';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VibexClient } from './VibexClient';

class BackgroundTaskSync {
  private client: VibexClient | null = null;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes

  async initialize() {
    const baseUrl = await AsyncStorage.getItem('vibex_base_url');
    const apiKey = await AsyncStorage.getItem('vibex_api_key');
    
    if (baseUrl) {
      this.client = new VibexClient({ baseUrl, apiKey: apiKey || undefined });
    }
  }

  start() {
    BackgroundJob.start({
      jobKey: 'vibexTaskSync',
      period: this.syncInterval,
    });

    BackgroundJob.on('vibexTaskSync', async () => {
      await this.syncTasks();
    });
  }

  stop() {
    BackgroundJob.stop({
      jobKey: 'vibexTaskSync',
    });
  }

  private async syncTasks() {
    if (!this.client) return;

    try {
      // Get local pending changes
      const pendingChanges = await AsyncStorage.getItem('pending_task_changes');
      if (pendingChanges) {
        const changes = JSON.parse(pendingChanges);
        
        // Sync pending changes to server
        for (const change of changes) {
          await this.client.updateTaskStatus(change.taskId, change.status);
        }
        
        // Clear pending changes
        await AsyncStorage.removeItem('pending_task_changes');
      }

      // Fetch latest tasks
      const tasks = await this.client.getTasks();
      await AsyncStorage.setItem('cached_tasks', JSON.stringify(tasks));
      
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}

export const backgroundSync = new BackgroundTaskSync();
```

### Flutter Integration

#### Vibex Task Manager Widget

```dart
// vibex_task_manager.dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

class Task {
  final int id;
  final String title;
  final String description;
  final String status;
  final String priority;
  final List<int> dependencies;
  final List<Subtask>? subtasks;

  Task({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    required this.dependencies,
    this.subtasks,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      status: json['status'],
      priority: json['priority'],
      dependencies: List<int>.from(json['dependencies']),
      subtasks: json['subtasks']?.map<Subtask>((s) => Subtask.fromJson(s)).toList(),
    );
  }
}

class Subtask {
  final int id;
  final String title;
  final String description;
  final String status;

  Subtask({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
  });

  factory Subtask.fromJson(Map<String, dynamic> json) {
    return Subtask(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      status: json['status'],
    );
  }
}

class VibexApiClient {
  final String baseUrl;
  final String? apiKey;

  VibexApiClient({required this.baseUrl, this.apiKey});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (apiKey != null) 'Authorization': 'Bearer $apiKey',
  };

  Future<List<Task>> getTasks({String? status, String? priority}) async {
    final params = <String, String>{};
    if (status != null) params['status'] = status;
    if (priority != null) params['priority'] = priority;

    final uri = Uri.parse('$baseUrl/api/tasks').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['tasks'] as List).map((task) => Task.fromJson(task)).toList();
    } else {
      throw Exception('Failed to load tasks: ${response.statusCode}');
    }
  }

  Future<Task> updateTaskStatus(int id, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/api/tasks/$id/status'),
      headers: _headers,
      body: json.encode({'status': status}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Task.fromJson(data['task']);
    } else {
      throw Exception('Failed to update task: ${response.statusCode}');
    }
  }

  Future<Task> addTask({
    required String title,
    required String description,
    String priority = 'medium',
    List<int> dependencies = const [],
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/tasks'),
      headers: _headers,
      body: json.encode({
        'title': title,
        'description': description,
        'priority': priority,
        'dependencies': dependencies,
      }),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return Task.fromJson(data['task']);
    } else {
      throw Exception('Failed to add task: ${response.statusCode}');
    }
  }
}

class TaskManagerWidget extends StatefulWidget {
  final VibexApiClient client;

  const TaskManagerWidget({Key? key, required this.client}) : super(key: key);

  @override
  _TaskManagerWidgetState createState() => _TaskManagerWidgetState();
}

class _TaskManagerWidgetState extends State<TaskManagerWidget> {
  List<Task> _tasks = [];
  bool _loading = true;
  String? _selectedStatus;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadTasks();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _loadTasks(showLoading: false);
    });
  }

  Future<void> _loadTasks({bool showLoading = true}) async {
    if (showLoading) setState(() => _loading = true);

    try {
      final tasks = await widget.client.getTasks(status: _selectedStatus);
      setState(() {
        _tasks = tasks;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load tasks: $e')),
      );
    }
  }

  Future<void> _updateTaskStatus(int taskId, String status) async {
    try {
      await widget.client.updateTaskStatus(taskId, status);
      _loadTasks(showLoading: false);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update task: $e')),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.grey;
      case 'in-progress':
        return Colors.blue;
      case 'done':
        return Colors.green;
      case 'review':
        return Colors.orange;
      case 'deferred':
        return Colors.purple;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority) {
      case 'high':
        return Icons.keyboard_double_arrow_up;
      case 'medium':
        return Icons.keyboard_arrow_up;
      case 'low':
        return Icons.keyboard_arrow_down;
      default:
        return Icons.remove;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Manager'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (status) {
              setState(() => _selectedStatus = status == 'all' ? null : status);
              _loadTasks();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All Tasks')),
              const PopupMenuItem(value: 'pending', child: Text('Pending')),
              const PopupMenuItem(value: 'in-progress', child: Text('In Progress')),
              const PopupMenuItem(value: 'done', child: Text('Done')),
            ],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _loadTasks(showLoading: false),
              child: _tasks.isEmpty
                  ? const Center(
                      child: Text(
                        'No tasks found',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: _tasks.length,
                      itemBuilder: (context, index) {
                        final task = _tasks[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: ExpansionTile(
                            leading: Icon(
                              _getPriorityIcon(task.priority),
                              color: _getStatusColor(task.status),
                            ),
                            title: Text(
                              task.title,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(task.description),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Chip(
                                      label: Text(task.status),
                                      backgroundColor: _getStatusColor(task.status).withOpacity(0.2),
                                      labelStyle: TextStyle(color: _getStatusColor(task.status)),
                                    ),
                                    const SizedBox(width: 8),
                                    Chip(
                                      label: Text(task.priority),
                                      backgroundColor: Colors.grey.withOpacity(0.2),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (task.dependencies.isNotEmpty) ...[
                                      Text(
                                        'Dependencies: ${task.dependencies.join(', ')}',
                                        style: const TextStyle(color: Colors.grey),
                                      ),
                                      const SizedBox(height: 8),
                                    ],
                                    if (task.subtasks?.isNotEmpty == true) ...[
                                      const Text(
                                        'Subtasks:',
                                        style: TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      ...task.subtasks!.map((subtask) => ListTile(
                                            dense: true,
                                            title: Text(subtask.title),
                                            subtitle: Text(subtask.description),
                                            trailing: Chip(
                                              label: Text(subtask.status),
                                              backgroundColor: _getStatusColor(subtask.status).withOpacity(0.2),
                                            ),
                                          )),
                                      const SizedBox(height: 8),
                                    ],
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        if (task.status == 'pending')
                                          ElevatedButton(
                                            onPressed: () => _updateTaskStatus(task.id, 'in-progress'),
                                            child: const Text('Start'),
                                          ),
                                        if (task.status == 'in-progress') ...[
                                          ElevatedButton(
                                            onPressed: () => _updateTaskStatus(task.id, 'done'),
                                            child: const Text('Complete'),
                                          ),
                                          const SizedBox(width: 8),
                                          OutlinedButton(
                                            onPressed: () => _updateTaskStatus(task.id, 'review'),
                                            child: const Text('Review'),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTaskDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddTaskDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedPriority = 'medium';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add New Task'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Title'),
              ),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedPriority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['low', 'medium', 'high'].map((priority) {
                  return DropdownMenuItem(
                    value: priority,
                    child: Text(priority),
                  );
                }).toList(),
                onChanged: (value) => setState(() => selectedPriority = value!),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (titleController.text.isNotEmpty) {
                  try {
                    await widget.client.addTask(
                      title: titleController.text,
                      description: descriptionController.text,
                      priority: selectedPriority,
                    );
                    Navigator.of(context).pop();
                    _loadTasks(showLoading: false);
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to add task: $e')),
                    );
                  }
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
}

// Usage in main app
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vibex Task Manager',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: TaskManagerWidget(
        client: VibexApiClient(
          baseUrl: 'https://your-vibex-server.com',
          apiKey: 'your-api-key',
        ),
      ),
    );
  }
}
```

---

## Desktop Applications

### Electron Integration

#### Main Process Setup

```typescript
// main.ts
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { VibexClient } from './vibex-client';

class VibexElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private vibexClient: VibexClient | null = null;

  constructor() {
    this.setupEventHandlers();
    this.setupAutoUpdater();
  }

  private setupEventHandlers() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      icon: path.join(__dirname, 'assets/icon.png'),
    });

    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu() {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Task',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-task');
            },
          },
          {
            label: 'Sync Tasks',
            accelerator: 'CmdOrCtrl+R',
            click: async () => {
              await this.syncTasks();
            },
          },
          { type: 'separator' },
          {
            label: 'Export Tasks',
            click: async () => {
              await this.exportTasks();
            },
          },
          {
            label: 'Import Tasks',
            click: async () => {
              await this.importTasks();
            },
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Vibex Task Manager',
            click: () => {
              shell.openExternal('https://github.com/ruvnet/vibex-task-manager');
            },
          },
          {
            label: 'Documentation',
            click: () => {
              shell.openExternal('https://github.com/ruvnet/vibex-task-manager/docs');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers() {
    // Task operations
    ipcMain.handle('vibex:get-tasks', async (_, filter) => {
      return await this.vibexClient?.getTasks(filter);
    });

    ipcMain.handle('vibex:add-task', async (_, task) => {
      return await this.vibexClient?.addTask(task);
    });

    ipcMain.handle('vibex:update-task', async (_, id, updates) => {
      return await this.vibexClient?.updateTask(id, updates);
    });

    ipcMain.handle('vibex:remove-task', async (_, id) => {
      return await this.vibexClient?.removeTask(id);
    });

    ipcMain.handle('vibex:get-next-task', async () => {
      return await this.vibexClient?.getNextTask();
    });

    ipcMain.handle('vibex:expand-task', async (_, id, options) => {
      return await this.vibexClient?.expandTask(id, options);
    });

    // Configuration
    ipcMain.handle('vibex:get-config', async () => {
      return await this.vibexClient?.getConfig();
    });

    ipcMain.handle('vibex:set-config', async (_, config) => {
      this.vibexClient = new VibexClient(config);
      return await this.vibexClient.setConfig(config);
    });

    // System operations
    ipcMain.handle('vibex:sync', async () => {
      return await this.syncTasks();
    });

    ipcMain.handle('vibex:export', async () => {
      return await this.exportTasks();
    });
  }

  private setupAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      this.mainWindow?.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
      this.mainWindow?.webContents.send('update-downloaded');
    });
  }

  private async syncTasks() {
    try {
      const tasks = await this.vibexClient?.getTasks();
      this.mainWindow?.webContents.send('tasks-synced', tasks);
      return tasks;
    } catch (error) {
      this.mainWindow?.webContents.send('sync-error', error.message);
      throw error;
    }
  }

  private async exportTasks() {
    // Implementation for exporting tasks
    const { dialog } = require('electron');
    
    const result = await dialog.showSaveDialog(this.mainWindow!, {
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      const tasks = await this.vibexClient?.getTasks();
      // Export logic here
      return result.filePath;
    }
  }

  private async importTasks() {
    // Implementation for importing tasks
    const { dialog } = require('electron');
    
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      // Import logic here
      return result.filePaths[0];
    }
  }
}

new VibexElectronApp();
```

#### Preload Script

```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

const vibexApi = {
  // Task operations
  getTasks: (filter?: any) => ipcRenderer.invoke('vibex:get-tasks', filter),
  addTask: (task: any) => ipcRenderer.invoke('vibex:add-task', task),
  updateTask: (id: number, updates: any) => ipcRenderer.invoke('vibex:update-task', id, updates),
  removeTask: (id: number) => ipcRenderer.invoke('vibex:remove-task', id),
  getNextTask: () => ipcRenderer.invoke('vibex:get-next-task'),
  expandTask: (id: number, options?: any) => ipcRenderer.invoke('vibex:expand-task', id, options),

  // Configuration
  getConfig: () => ipcRenderer.invoke('vibex:get-config'),
  setConfig: (config: any) => ipcRenderer.invoke('vibex:set-config', config),

  // System operations
  sync: () => ipcRenderer.invoke('vibex:sync'),
  export: () => ipcRenderer.invoke('vibex:export'),

  // Event listeners
  onMenuNewTask: (callback: () => void) => {
    ipcRenderer.on('menu-new-task', callback);
  },
  
  onTasksSynced: (callback: (tasks: any[]) => void) => {
    ipcRenderer.on('tasks-synced', (_, tasks) => callback(tasks));
  },

  onSyncError: (callback: (error: string) => void) => {
    ipcRenderer.on('sync-error', (_, error) => callback(error));
  },

  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },

  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  },

  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-task');
    ipcRenderer.removeAllListeners('tasks-synced');
    ipcRenderer.removeAllListeners('sync-error');
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-downloaded');
  },
};

contextBridge.exposeInMainWorld('vibexApi', vibexApi);

// Type declarations for renderer
declare global {
  interface Window {
    vibexApi: typeof vibexApi;
  }
}
```

### Tauri Integration

#### Rust Backend Commands

```rust
// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use reqwest::Client;
use tauri::{command, State, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Task {
    id: u32,
    title: String,
    description: String,
    status: String,
    priority: String,
    dependencies: Vec<u32>,
    subtasks: Option<Vec<Subtask>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Subtask {
    id: u32,
    title: String,
    description: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct VibexConfig {
    base_url: String,
    api_key: Option<String>,
}

struct VibexState {
    client: Client,
    config: Mutex<Option<VibexConfig>>,
}

impl VibexState {
    fn new() -> Self {
        Self {
            client: Client::new(),
            config: Mutex::new(None),
        }
    }
}

#[command]
async fn get_tasks(
    state: State<'_, VibexState>,
    status: Option<String>,
    priority: Option<String>,
) -> Result<Vec<Task>, String> {
    let config_guard = state.config.lock().await;
    let config = config_guard
        .as_ref()
        .ok_or("Vibex not configured")?;

    let mut url = format!("{}/api/tasks", config.base_url);
    let mut params = Vec::new();
    
    if let Some(s) = status {
        params.push(format!("status={}", s));
    }
    if let Some(p) = priority {
        params.push(format!("priority={}", p));
    }
    
    if !params.is_empty() {
        url.push('?');
        url.push_str(&params.join("&"));
    }

    let mut request = state.client.get(&url);
    
    if let Some(api_key) = &config.api_key {
        request = request.bearer_auth(api_key);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let tasks_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    let tasks: Vec<Task> = serde_json::from_value(
        tasks_response.get("tasks").unwrap_or(&serde_json::Value::Array(vec![])).clone()
    ).map_err(|e| format!("Task deserialization error: {}", e))?;

    Ok(tasks)
}

#[command]
async fn add_task(
    state: State<'_, VibexState>,
    title: String,
    description: String,
    priority: Option<String>,
) -> Result<Task, String> {
    let config_guard = state.config.lock().await;
    let config = config_guard
        .as_ref()
        .ok_or("Vibex not configured")?;

    let mut request_body = HashMap::new();
    request_body.insert("title", title);
    request_body.insert("description", description);
    request_body.insert("priority", priority.unwrap_or_else(|| "medium".to_string()));

    let mut request = state.client
        .post(&format!("{}/api/tasks", config.base_url))
        .json(&request_body);
    
    if let Some(api_key) = &config.api_key {
        request = request.bearer_auth(api_key);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let task_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    let task: Task = serde_json::from_value(
        task_response.get("task").unwrap().clone()
    ).map_err(|e| format!("Task deserialization error: {}", e))?;

    Ok(task)
}

#[command]
async fn update_task_status(
    state: State<'_, VibexState>,
    id: u32,
    status: String,
) -> Result<Task, String> {
    let config_guard = state.config.lock().await;
    let config = config_guard
        .as_ref()
        .ok_or("Vibex not configured")?;

    let mut request_body = HashMap::new();
    request_body.insert("status", status);

    let mut request = state.client
        .put(&format!("{}/api/tasks/{}/status", config.base_url, id))
        .json(&request_body);
    
    if let Some(api_key) = &config.api_key {
        request = request.bearer_auth(api_key);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let task_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    let task: Task = serde_json::from_value(
        task_response.get("task").unwrap().clone()
    ).map_err(|e| format!("Task deserialization error: {}", e))?;

    Ok(task)
}

#[command]
async fn get_next_task(state: State<'_, VibexState>) -> Result<Option<Task>, String> {
    let config_guard = state.config.lock().await;
    let config = config_guard
        .as_ref()
        .ok_or("Vibex not configured")?;

    let mut request = state.client
        .get(&format!("{}/api/tasks/next", config.base_url));
    
    if let Some(api_key) = &config.api_key {
        request = request.bearer_auth(api_key);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let task_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    if let Some(task_value) = task_response.get("task") {
        if task_value.is_null() {
            Ok(None)
        } else {
            let task: Task = serde_json::from_value(task_value.clone())
                .map_err(|e| format!("Task deserialization error: {}", e))?;
            Ok(Some(task))
        }
    } else {
        Ok(None)
    }
}

#[command]
async fn set_config(
    state: State<'_, VibexState>,
    base_url: String,
    api_key: Option<String>,
) -> Result<(), String> {
    let config = VibexConfig { base_url, api_key };
    let mut config_guard = state.config.lock().await;
    *config_guard = Some(config);
    Ok(())
}

#[command]
async fn get_config(state: State<'_, VibexState>) -> Result<Option<VibexConfig>, String> {
    let config_guard = state.config.lock().await;
    Ok(config_guard.clone())
}

fn main() {
    tauri::Builder::default()
        .manage(VibexState::new())
        .invoke_handler(tauri::generate_handler![
            get_tasks,
            add_task,
            update_task_status,
            get_next_task,
            set_config,
            get_config
        ])
        .setup(|app| {
            // Initialize app
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### Frontend React Integration

```typescript
// src/components/TaskManager.tsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/api/dialog';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dependencies: number[];
  subtasks?: Subtask[];
}

interface Subtask {
  id: number;
  title: string;
  description: string;
  status: string;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; priority?: string }>({});
  const [config, setConfig] = useState<{ base_url: string; api_key?: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config) {
      loadTasks();
    }
  }, [config, filter]);

  const loadConfig = async () => {
    try {
      const savedConfig = await invoke<{ base_url: string; api_key?: string } | null>('get_config');
      if (savedConfig) {
        setConfig(savedConfig);
      } else {
        // Show config dialog
        await showConfigDialog();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      await message('Failed to load configuration', { title: 'Error', type: 'error' });
    }
  };

  const showConfigDialog = async () => {
    // Implement configuration dialog
    const baseUrl = prompt('Enter Vibex server URL:');
    const apiKey = prompt('Enter API key (optional):');
    
    if (baseUrl) {
      try {
        await invoke('set_config', { baseUrl, apiKey: apiKey || null });
        setConfig({ base_url: baseUrl, api_key: apiKey || undefined });
      } catch (error) {
        console.error('Failed to save config:', error);
        await message('Failed to save configuration', { title: 'Error', type: 'error' });
      }
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await invoke<Task[]>('get_tasks', {
        status: filter.status || null,
        priority: filter.priority || null,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      await message('Failed to load tasks', { title: 'Error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: number, status: string) => {
    try {
      await invoke('update_task_status', { id, status });
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      await message('Failed to update task', { title: 'Error', type: 'error' });
    }
  };

  const addTask = async (title: string, description: string, priority?: string) => {
    try {
      await invoke('add_task', { title, description, priority: priority || 'medium' });
      await loadTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
      await message('Failed to add task', { title: 'Error', type: 'error' });
    }
  };

  const getNextTask = async () => {
    try {
      const nextTask = await invoke<Task | null>('get_next_task');
      if (nextTask) {
        await message(`Next task: ${nextTask.title}`, { title: 'Next Task', type: 'info' });
      } else {
        await message('No tasks available!', { title: 'Next Task', type: 'info' });
      }
    } catch (error) {
      console.error('Failed to get next task:', error);
      await message('Failed to get next task', { title: 'Error', type: 'error' });
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: '#6B7280',
      'in-progress': '#3B82F6',
      done: '#10B981',
      review: '#F59E0B',
      deferred: '#8B5CF6',
      cancelled: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Configuration Required</h2>
          <button
            onClick={showConfigDialog}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Configure Vibex Server
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Title Bar */}
      <div 
        data-tauri-drag-region 
        className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4"
      >
        <h1 className="text-lg font-semibold text-gray-900">Vibex Task Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={getNextTask}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Next Task
          </button>
          <button
            onClick={() => showConfigDialog()}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-4">
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="review">Review</option>
          </select>
          
          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks found
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Priority: {task.priority}
                  </span>
                  
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Start
                      </button>
                    )}
                    
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'done')}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Subtasks:</p>
                    <div className="space-y-1">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700">{subtask.title}</span>
                          <span
                            className="px-1 py-0.5 rounded text-white"
                            style={{ backgroundColor: getStatusColor(subtask.status) }}
                          >
                            {subtask.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
```

This comprehensive platform integration guide provides production-ready examples for mobile (React Native, Flutter), desktop (Electron, Tauri), and includes native API clients, background sync, offline support, and platform-specific UI patterns. Each example demonstrates proper error handling, configuration management, and follows platform best practices.