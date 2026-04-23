const Project = require('../models/Project');
const archiver = require('archiver');

const MAX_PROJECT_NAME_LENGTH = Number(process.env.MAX_PROJECT_NAME_LENGTH || 64);
const MAX_FILE_NAME_LENGTH = Number(process.env.MAX_FILE_NAME_LENGTH || 120);
const MAX_FILE_CONTENT_BYTES = Number(process.env.MAX_FILE_CONTENT_BYTES || 128 * 1024);
const MAX_FILES_PER_PROJECT = Number(process.env.MAX_FILES_PER_PROJECT || 100);

function publicOrOwnedScope(ownerId) {
    return ownerId ? { ownerId } : { ownerId: { $exists: false } };
}

function buildProjectQuery(projectId, ownerId) {
    return { _id: projectId, ...publicOrOwnedScope(ownerId) };
}

function ensureProjectName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Project name is required');
    if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
        throw new Error(`Project name exceeds ${MAX_PROJECT_NAME_LENGTH} characters`);
    }
    return trimmed;
}

function ensureFileName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('File name is required');
    if (trimmed.length > MAX_FILE_NAME_LENGTH) {
        throw new Error(`File name exceeds ${MAX_FILE_NAME_LENGTH} characters`);
    }
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
        throw new Error('Nested or relative file paths are not supported');
    }
    return trimmed;
}

function ensureFileContent(content) {
    const normalized = typeof content === 'string' ? content : String(content || '');
    const size = Buffer.byteLength(normalized, 'utf8');
    if (size > MAX_FILE_CONTENT_BYTES) {
        throw new Error(`File content exceeds ${MAX_FILE_CONTENT_BYTES} bytes`);
    }
    return normalized;
}

/**
 * Get all projects and their files from MongoDB
 */
async function listProjects(ownerId) {
    const projects = await Project.find(publicOrOwnedScope(ownerId)).sort({ updatedAt: -1 });
    
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
async function createProject(name, ownerId) {
    const normalizedName = ensureProjectName(name);
    const project = new Project({ name: normalizedName, ownerId: ownerId || undefined, files: [] });

    try {
        await project.save();
        return {
            id: project._id,
            name: project.name,
            createdAt: project.createdAt,
            files: []
        };
    } catch (error) {
        if (error?.code === 11000) {
            throw new Error('A project with this name already exists');
        }
        throw error;
    }
}

async function renameProject(projectId, name, ownerId) {
    const normalizedName = ensureProjectName(name);
    const project = await Project.findOne(buildProjectQuery(projectId, ownerId));
    if (!project) throw new Error('Project not found or not accessible');

    project.name = normalizedName;

    try {
        await project.save();
    } catch (error) {
        if (error?.code === 11000) {
            throw new Error('A project with this name already exists');
        }
        throw error;
    }

    return {
        id: project._id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        files: project.files.map(file => ({
            id: file._id,
            name: file.name,
            content: file.content,
            language: file.language,
            updatedAt: file.updatedAt
        }))
    };
}

/**
 * Save/Update a file in a project
 */
async function saveFile(projectId, fileNameOrId, content, ownerId) {
    const project = await Project.findOne(buildProjectQuery(projectId, ownerId));
    if (!project) throw new Error('Project not found or not accessible');

    const normalizedContent = ensureFileContent(content);
    let file = project.files.find(f => f.name === fileNameOrId || String(f._id) === String(fileNameOrId));
    const resolvedFileName = file ? file.name : ensureFileName(fileNameOrId);
    
    // Detect language from extension
    const path = require('path');
    const ext = path.extname(resolvedFileName).toLowerCase();
    let language = 'javascript';
    if (ext === '.py') language = 'python';
    if (ext === '.java') language = 'java';
    if (ext === '.c') language = 'c';

    if (file) {
        file.content = normalizedContent;
        file.language = language;
        file.updatedAt = Date.now();
    } else {
        if (project.files.length >= MAX_FILES_PER_PROJECT) {
            throw new Error(`Project cannot contain more than ${MAX_FILES_PER_PROJECT} files`);
        }
        project.files.push({ name: resolvedFileName, content: normalizedContent, language });
    }

    project.updatedAt = Date.now();
    await project.save();
    
    const updatedFile = project.files.find(
        f => f.name === resolvedFileName || String(f._id) === String(fileNameOrId)
    );
    return {
        id: updatedFile._id,
        name: updatedFile.name,
        content: updatedFile.content,
        language: updatedFile.language,
        updatedAt: updatedFile.updatedAt
    };
}

async function renameFile(projectId, fileId, nextName, ownerId) {
    const project = await Project.findOne(buildProjectQuery(projectId, ownerId));
    if (!project) throw new Error('Project not found or not accessible');

    const file = project.files.id(fileId);
    if (!file) throw new Error('File not found');

    const normalizedName = ensureFileName(nextName);
    const duplicate = project.files.find(
        existing => String(existing._id) !== String(fileId) && existing.name === normalizedName
    );
    if (duplicate) throw new Error('A file with this name already exists');

    const path = require('path');
    const ext = path.extname(normalizedName).toLowerCase();
    let language = 'javascript';
    if (ext === '.py') language = 'python';
    if (ext === '.java') language = 'java';
    if (ext === '.c') language = 'c';

    file.name = normalizedName;
    file.language = language;
    file.updatedAt = Date.now();
    project.updatedAt = Date.now();
    await project.save();

    return {
        id: file._id,
        name: file.name,
        content: file.content,
        language: file.language,
        updatedAt: file.updatedAt
    };
}

/**
 * Delete a file
 */
async function deleteFile(projectId, fileNameOrId, ownerId) {
    const project = await Project.findOne(buildProjectQuery(projectId, ownerId));
    if (!project) return;

    project.files = project.files.filter(
        f => f.name !== fileNameOrId && String(f._id) !== String(fileNameOrId)
    );
    project.updatedAt = Date.now();
    await project.save();
}

/**
 * Delete a project
 */
async function deleteProject(projectId, ownerId) {
    await Project.deleteOne(buildProjectQuery(projectId, ownerId));
}

/**
 * Zip a project for download (Generated from MongoDB data)
 */
async function zipProject(projectId, outStream, ownerId) {
    const project = await Project.findOne(buildProjectQuery(projectId, ownerId));
    if (!project) throw new Error('Project not found or not accessible');

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
    renameProject,
    saveFile,
    renameFile,
    deleteFile,
    deleteProject,
    zipProject
};
