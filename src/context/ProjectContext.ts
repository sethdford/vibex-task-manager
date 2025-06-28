import fs from 'fs/promises';
import path from 'path';

export interface FileInfo {
  path: string;
  content: string;
  lastModified: Date;
  size: number;
}

export interface ProjectStructure {
  root: string;
  files: FileInfo[];
  directories: string[];
  packageJson?: any;
  tsConfig?: any;
  gitStatus?: {
    branch: string;
    staged: string[];
    unstaged: string[];
    untracked: string[];
  };
}

export class ProjectContext {
  private structure: ProjectStructure | null = null;
  private contextFile: string | null = null;
  private lastAnalyzed: Date | null = null;

  async initialize(projectRoot: string, contextFilePath?: string): Promise<void> {
    this.structure = {
      root: projectRoot,
      files: [],
      directories: [],
    };

    if (contextFilePath) {
      this.contextFile = path.resolve(projectRoot, contextFilePath);
    }

    await this.analyzeProject();
  }

  async analyzeProject(): Promise<void> {
    if (!this.structure) {
      throw new Error('ProjectContext not initialized');
    }

    try {
      // Scan project structure
      await this.scanDirectory(this.structure.root);
      
      // Load package.json if it exists
      await this.loadPackageJson();
      
      // Load TypeScript config if it exists
      await this.loadTsConfig();
      
      // Get git status if it's a git repository
      await this.loadGitStatus();

      this.lastAnalyzed = new Date();
    } catch (error) {
      console.warn('Warning: Could not fully analyze project:', error);
    }
  }

  private async scanDirectory(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<void> {
    if (currentDepth >= maxDepth || !this.structure) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.structure.root, fullPath);

        // Skip common directories that shouldn't be analyzed
        if (this.shouldSkipPath(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          this.structure.directories.push(relativePath);
          await this.scanDirectory(fullPath, maxDepth, currentDepth + 1);
        } else if (entry.isFile() && this.shouldIncludeFile(relativePath)) {
          try {
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, 'utf-8');
            
            this.structure.files.push({
              path: relativePath,
              content,
              lastModified: stats.mtime,
              size: stats.size
            });
          } catch (error) {
            // Skip files that can't be read
            console.warn(`Could not read file ${relativePath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error);
    }
  }

  private shouldSkipPath(relativePath: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      'logs',
      '*.log'
    ];

    return skipPatterns.some(pattern => 
      relativePath.includes(pattern) || 
      relativePath.startsWith('.') && pattern.startsWith('.')
    );
  }

  private shouldIncludeFile(relativePath: string): boolean {
    const includeExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.json', '.md', '.yml', '.yaml',
      '.env', '.env.example',
      '.gitignore', '.npmignore'
    ];

    const includeFiles = [
      'package.json',
      'tsconfig.json',
      'README.md',
      'Dockerfile',
      'docker-compose.yml'
    ];

    const fileName = path.basename(relativePath);
    const extension = path.extname(relativePath);

    return includeFiles.includes(fileName) || 
           includeExtensions.includes(extension);
  }

  private async loadPackageJson(): Promise<void> {
    if (!this.structure) return;

    try {
      const packageJsonPath = path.join(this.structure.root, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      this.structure.packageJson = JSON.parse(content);
    } catch (error) {
      // package.json doesn't exist or can't be read
    }
  }

  private async loadTsConfig(): Promise<void> {
    if (!this.structure) return;

    try {
      const tsConfigPath = path.join(this.structure.root, 'tsconfig.json');
      const content = await fs.readFile(tsConfigPath, 'utf-8');
      this.structure.tsConfig = JSON.parse(content);
    } catch (error) {
      // tsconfig.json doesn't exist or can't be read
    }
  }

  private async loadGitStatus(): Promise<void> {
    if (!this.structure) return;

    try {
      // This is a placeholder - in a real implementation, you'd use a git library
      // or execute git commands to get the actual status
      this.structure.gitStatus = {
        branch: 'main', // placeholder
        staged: [],
        unstaged: [],
        untracked: []
      };
    } catch (error) {
      // Not a git repository or git not available
    }
  }

  getProjectStructure(): ProjectStructure | null {
    return this.structure;
  }

  getFileContent(relativePath: string): string | null {
    if (!this.structure) return null;
    
    const file = this.structure.files.find(f => f.path === relativePath);
    return file?.content || null;
  }

  getProjectSummary(): string {
    if (!this.structure) return 'Project not analyzed';

    const fileCount = this.structure.files.length;
    const dirCount = this.structure.directories.length;
    const hasPackageJson = !!this.structure.packageJson;
    const hasTsConfig = !!this.structure.tsConfig;
    const isGitRepo = !!this.structure.gitStatus;

    return `Project Summary:
- Root: ${this.structure.root}
- Files: ${fileCount}
- Directories: ${dirCount}
- Package.json: ${hasPackageJson ? 'Yes' : 'No'}
- TypeScript: ${hasTsConfig ? 'Yes' : 'No'}
- Git Repository: ${isGitRepo ? 'Yes' : 'No'}
- Last Analyzed: ${this.lastAnalyzed?.toLocaleString() || 'Never'}`;
  }

  async saveContext(contextData: any): Promise<void> {
    if (!this.contextFile) return;

    try {
      await fs.writeFile(this.contextFile, JSON.stringify(contextData, null, 2));
    } catch (error) {
      console.warn('Could not save context:', error);
    }
  }

  async loadContext(): Promise<any> {
    if (!this.contextFile) return null;

    try {
      const content = await fs.readFile(this.contextFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Context file doesn't exist or can't be read
      return null;
    }
  }
} 