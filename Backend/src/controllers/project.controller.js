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

exports.listProjects = async (req, res) => {
  try {
    const projects = await projectServices.listProjects(req.user?.id);
    res.json({ projects });
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.createProject = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const project = await projectServices.createProject(name, req.user?.id);
    res.json(project);
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.renameProject = async (req, res) => {
  const { projectName } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const project = await projectServices.renameProject(projectName, name, req.user?.id);
    res.json(project);
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.saveFile = async (req, res) => {
  const { projectName } = req.params;
  const { name, content } = req.body;
  if (!name) return res.status(400).json({ error: 'File name is required' });
  try {
    const file = await projectServices.saveFile(projectName, name, content || '', req.user?.id);
    res.json(file);
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.renameFile = async (req, res) => {
  const { projectName, fileName } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'File name is required' });
  try {
    const file = await projectServices.renameFile(projectName, fileName, name, req.user?.id);
    res.json(file);
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { projectName, fileName } = req.params;
  try {
    await projectServices.deleteFile(projectName, fileName, req.user?.id);
    res.json({ success: true });
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  const { projectName } = req.params;
  try {
    await projectServices.deleteProject(projectName, req.user?.id);
    res.json({ success: true });
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};

exports.downloadProject = async (req, res) => {
  const { projectName } = req.params;
  try {
    res.attachment(`${projectName}.zip`);
    await projectServices.zipProject(projectName, res, req.user?.id);
  } catch (err) {
    res.status(getStatusCode(err)).json({ error: err.message });
  }
};
