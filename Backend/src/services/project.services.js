const Project = require('../models/Project');
const archiver = require('archiver');

/**
 * Get all projects and their files from MongoDB
 */
async function listProjects() {
    const projects = await Project.find().sort({ updatedAt: -1 });
    
    // Map to the format expected by the frontend
    return projects.map(p => ({
        id: p._id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        files: p.files.map(f => ({
            id: f._id,
            name: f.name,
            content: f.content,
            language: f.language,
            updatedAt: f.updatedAt
        }))
    }));
}

/**
 * Create a new project in MongoDB
 */
async function createProject(name) {
    const project = new Project({ name, files: [] });
    await project.save();
    return {
        id: project._id,
        name: project.name,
        createdAt: project.createdAt,
        files: []
    };
}

/**
 * Save/Update a file in a project
 */
async function saveFile(projectName, fileName, content) {
    const project = await Project.findOne({ name: projectName });
    if (!project) throw new Error('Project not found');

    let file = project.files.find(f => f.name === fileName);
    
    // Detect language from extension
    const path = require('path');
    const ext = path.extname(fileName).toLowerCase();
    let language = 'javascript';
    if (ext === '.py') language = 'python';
    if (ext === '.java') language = 'java';
    if (ext === '.c') language = 'c';

    if (file) {
        file.content = content;
        file.language = language;
        file.updatedAt = Date.now();
    } else {
        project.files.push({ name: fileName, content, language });
    }

    project.updatedAt = Date.now();
    await project.save();
    
    const updatedFile = project.files.find(f => f.name === fileName);
    return {
        id: updatedFile._id,
        name: updatedFile.name,
        content: updatedFile.content,
        language: updatedFile.language,
        updatedAt: updatedFile.updatedAt
    };
}

/**
 * Delete a file
 */
async function deleteFile(projectName, fileName) {
    const project = await Project.findOne({ name: projectName });
    if (!project) return;

    project.files = project.files.filter(f => f.name !== fileName);
    project.updatedAt = Date.now();
    await project.save();
}

/**
 * Delete a project
 */
async function deleteProject(projectName) {
    await Project.deleteOne({ name: projectName });
}

/**
 * Zip a project for download (Generated from MongoDB data)
 */
async function zipProject(projectName, outStream) {
    const project = await Project.findOne({ name: projectName });
    if (!project) throw new Error('Project not found');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => { throw err; });
    archive.pipe(outStream);

    // Add each file from the database to the archive
    project.files.forEach(file => {
        archive.append(file.content, { name: file.name });
    });

    await archive.finalize();
}

module.exports = {
    listProjects,
    createProject,
    saveFile,
    deleteFile,
    deleteProject,
    zipProject
};
