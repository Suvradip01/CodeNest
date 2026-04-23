const express = require('express');
const router = express.Router();
const projectServices = require('../services/project.services');

router.get('/', async (req, res) => {
    try {
        const projects = await projectServices.listProjects();
        res.json({ projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    try {
        const project = await projectServices.createProject(name);
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:projectName/files', async (req, res) => {
    const { projectName } = req.params;
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });
    try {
        const file = await projectServices.saveFile(projectName, name, content || '');
        res.json(file);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:projectName/files/:fileName', async (req, res) => {
    const { projectName, fileName } = req.params;
    try {
        await projectServices.deleteFile(projectName, fileName);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:projectName', async (req, res) => {
    const { projectName } = req.params;
    try {
        await projectServices.deleteProject(projectName);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:projectName/download', async (req, res) => {
    const { projectName } = req.params;
    try {
        res.attachment(`${projectName}.zip`);
        projectServices.zipProject(projectName, res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
