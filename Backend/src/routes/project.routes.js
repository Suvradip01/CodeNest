const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.patch('/:projectName', projectController.renameProject);

router.post('/:projectName/files', projectController.saveFile);
router.patch('/:projectName/files/:fileName', projectController.renameFile);
router.delete('/:projectName/files/:fileName', projectController.deleteFile);

router.delete('/:projectName', projectController.deleteProject);
router.get('/:projectName/download', projectController.downloadProject);

module.exports = router;
