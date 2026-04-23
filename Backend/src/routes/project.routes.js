const express = require('express');
const router = express.Router();
const projectServices = require('../services/project.services');

function getStatusCode(error) {
    if (error?.statusCode) return error.statusCode;
    if (/not found|not accessible/i.test(error?.message || '')) return 404;
    if (
        /required|exceeds|not supported|cannot contain|already exists/i.test(error?.message || '')
    ) {
        return 400;
    }
    return 500;
}

router.get('/', async (req, res) => {
    try {
        const projects = await projectServices.listProjects(req.user?.id);
        res.json({ projects });
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    try {
        const project = await projectServices.createProject(name, req.user?.id);
        res.json(project);
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.patch('/:projectName', async (req, res) => {
    const { projectName } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    try {
        const project = await projectServices.renameProject(projectName, name, req.user?.id);
        res.json(project);
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.post('/:projectName/files', async (req, res) => {
    const { projectName } = req.params;
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });
    try {
        const file = await projectServices.saveFile(projectName, name, content || '', req.user?.id);
        res.json(file);
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.patch('/:projectName/files/:fileName', async (req, res) => {
    const { projectName, fileName } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });
    try {
        const file = await projectServices.renameFile(projectName, fileName, name, req.user?.id);
        res.json(file);
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.delete('/:projectName/files/:fileName', async (req, res) => {
    const { projectName, fileName } = req.params;
    try {
        await projectServices.deleteFile(projectName, fileName, req.user?.id);
        res.json({ success: true });
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.delete('/:projectName', async (req, res) => {
    const { projectName } = req.params;
    try {
        await projectServices.deleteProject(projectName, req.user?.id);
        res.json({ success: true });
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

router.get('/:projectName/download', async (req, res) => {
    const { projectName } = req.params;
    try {
        res.attachment(`${projectName}.zip`);
        await projectServices.zipProject(projectName, res, req.user?.id);
    } catch (err) {
        res.status(getStatusCode(err)).json({ error: err.message });
    }
});

module.exports = router;
