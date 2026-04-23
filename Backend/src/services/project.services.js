const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

// Ensure projects directory exists
fs.ensureDirSync(PROJECTS_DIR);

/**
 * Get all projects and their files from disk
 */
async function listProjects() {
    const projectNames = await fs.readdir(PROJECTS_DIR);
    const projects = [];

    for (const name of projectNames) {
        const projectPath = path.join(PROJECTS_DIR, name);
        const stats = await fs.stat(projectPath);

        if (stats.isDirectory()) {
            const fileNames = await fs.readdir(projectPath);
            const files = [];

            for (const fileName of fileNames) {
                if (fileName === '.metadata.json') continue;
                
                const filePath = path.join(projectPath, fileName);
                const fileStats = await fs.stat(filePath);

                if (fileStats.isFile()) {
                    const content = await fs.readFile(filePath, 'utf8');
                    // Detect language from extension
                    const ext = path.extname(fileName).toLowerCase();
                    let language = 'javascript';
                    if (ext === '.py') language = 'python';
                    if (ext === '.java') language = 'java';
                    if (ext === '.c') language = 'c';

                    files.push({
                        id: fileName, // Use filename as ID for simplicity
                        name: fileName,
                        language,
                        content,
                        createdAt: fileStats.birthtimeMs
                    });
                }
            }

            projects.push({
                id: name,
                name: name,
                createdAt: stats.birthtimeMs,
                files
            });
        }
    }

    return projects;
}

/**
 * Create a new project folder
 */
async function createProject(name) {
    const projectPath = path.join(PROJECTS_DIR, name);
    await fs.ensureDir(projectPath);
    return { id: name, name, createdAt: Date.now(), files: [] };
}

/**
 * Save/Update a file in a project
 */
async function saveFile(projectName, fileName, content) {
    const projectPath = path.join(PROJECTS_DIR, projectName);
    await fs.ensureDir(projectPath);
    
    const filePath = path.join(projectPath, fileName);
    await fs.writeFile(filePath, content, 'utf8');
    
    const stats = await fs.stat(filePath);
    return {
        id: fileName,
        name: fileName,
        content,
        createdAt: stats.birthtimeMs
    };
}

/**
 * Delete a file
 */
async function deleteFile(projectName, fileName) {
    const filePath = path.join(PROJECTS_DIR, projectName, fileName);
    await fs.remove(filePath);
}

/**
 * Delete a project
 */
async function deleteProject(projectName) {
    const projectPath = path.join(PROJECTS_DIR, projectName);
    await fs.remove(projectPath);
}

/**
 * Zip a project for download
 */
function zipProject(projectName, outStream) {
    const projectPath = path.join(PROJECTS_DIR, projectName);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => { throw err; });
    archive.pipe(outStream);
    archive.directory(projectPath, false);
    archive.finalize();
}

module.exports = {
    listProjects,
    createProject,
    saveFile,
    deleteFile,
    deleteProject,
    zipProject
};
