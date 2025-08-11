import { generateUUID, downloadPageAsImage } from './utils.js';

const storageKey = 'gypsumProjectPlannerData';
let projects = [];
let activeProjectId = null;

const projectSelect = document.getElementById('project-select');
const areasContainer = document.getElementById('areas-container');
const viewSection = document.getElementById('view-section');

// Event Delegation for dynamic elements
document.addEventListener('click', (e) => {
    if (e.target.matches('.add-task-btn')) {
        const areaIndex = e.target.dataset.areaIndex;
        const project = getActiveProject();
        if (project && project.areas[areaIndex]) {
            const newTask = {
                id: generateUUID(),
                team: 'Gypsum',
                startDate: '',
                endDate: ''
            };
            project.areas[areaIndex].tasks.push(newTask);
            saveProjects();
            renderProjectAreas();
        }
    } else if (e.target.matches('.delete-task-btn')) {
        const areaIndex = e.target.dataset.areaIndex;
        const taskIndex = e.target.dataset.taskIndex;
        const project = getActiveProject();
        if (project && project.areas[areaIndex]) {
            project.areas[areaIndex].tasks.splice(taskIndex, 1);
            saveProjects();
            renderProjectAreas();
        }
    }
});

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const saveProjects = () => {
    localStorage.setItem(storageKey, JSON.stringify(projects));
};

const loadProjects = () => {
    const data = localStorage.getItem(storageKey);
    if (data) {
        projects = JSON.parse(data);
    }
    if (projects.length === 0) {
        createNewProject('My First Project');
        saveProjects();
    }
    renderProjectDropdown();
    setActiveProject(projects[0].id);
};

const getActiveProject = () => projects.find(p => p.id === activeProjectId);

const createNewProject = (name) => {
    const newProject = {
        id: generateUUID(),
        name: name,
        areas: [{
            name: 'Default Area',
            tasks: []
        }]
    };
    projects.push(newProject);
    saveProjects();
    renderProjectDropdown();
    setActiveProject(newProject.id);
};

const deleteProject = (projectId) => {
    projects = projects.filter(p => p.id !== projectId);
    saveProjects();
    if (projects.length > 0) {
        setActiveProject(projects[0].id);
    } else {
        createNewProject('My First Project');
    }
};

const setActiveProject = (projectId) => {
    activeProjectId = projectId;
    projectSelect.value = projectId;
    renderProjectAreas();
};

const renderProjectDropdown = () => {
    projectSelect.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
};

const renderProjectAreas = () => {
    const project = getActiveProject();
    if (!project) return;

    areasContainer.innerHTML = '';
    project.areas.forEach((area, areaIndex) => {
        const areaBlock = document.createElement('div');
        areaBlock.className = 'area-block';
        areaBlock.innerHTML = `
            <div class="area-header">
                <input type="text" class="area-name-input" value="${area.name}" data-area-index="${areaIndex}" placeholder="Area Name">
                <button class="btn btn-secondary add-task-btn" data-area-index="${areaIndex}">Add New Task</button>
            </div>
            <div class="tasks-list"></div>
        `;
        const tasksList = areaBlock.querySelector('.tasks-list');
        area.tasks.forEach((task, taskIndex) => {
            tasksList.appendChild(createTaskRow(task, areaIndex, taskIndex));
        });
        areasContainer.appendChild(areaBlock);
    });
};

const createTaskRow = (task, areaIndex, taskIndex) => {
    const row = document.createElement('div');
    row.className = 'task-row';
    row.innerHTML = `
        <select class="team-select" data-area-index="${areaIndex}" data-task-index="${taskIndex}">
            <option value="Gypsum" ${task.team === 'Gypsum' ? 'selected' : ''}>Gypsum</option>
            <option value="AC" ${task.team === 'AC' ? 'selected' : ''}>AC</option>
            <option value="Wiring" ${task.team === 'Wiring' ? 'selected' : ''}>Wiring</option>
            <option value="Plumbing" ${task.team === 'Plumbing' ? 'selected' : ''}>Plumbing</option>
        </select>
        <input type="date" class="start-date-input" value="${task.startDate}" data-area-index="${areaIndex}" data-task-index="${taskIndex}">
        <input type="date" class="end-date-input" value="${task.endDate}" data-area-index="${areaIndex}" data-task-index="${taskIndex}">
        <button class="btn btn-danger delete-task-btn" data-area-index="${areaIndex}" data-task-index="${taskIndex}">Delete</button>
    `;
    return row;
};

// Event listeners for static elements
projectSelect.addEventListener('change', (e) => setActiveProject(e.target.value));
document.getElementById('new-project-btn').addEventListener('click', () => {
    const projectName = prompt('Enter new project name:');
    if (projectName) createNewProject(projectName);
});
document.getElementById('delete-project-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this project?')) {
        deleteProject(activeProjectId);
    }
});
document.getElementById('add-area-btn').addEventListener('click', () => {
    const project = getActiveProject();
    if (project) {
        project.areas.push({ name: 'New Area', tasks: [] });
        saveProjects();
        renderProjectAreas();
    }
});

// Event delegation for input changes
areasContainer.addEventListener('input', debounce((e) => {
    const project = getActiveProject();
    if (!project) return;
    const target = e.target;
    const areaIndex = target.dataset.areaIndex;
    const taskIndex = target.dataset.taskIndex;

    if (target.classList.contains('area-name-input')) {
        project.areas[areaIndex].name = target.value;
    } else if (target.classList.contains('team-select')) {
        project.areas[areaIndex].tasks[taskIndex].team = target.value;
    } else if (target.classList.contains('start-date-input')) {
        project.areas[areaIndex].tasks[taskIndex].startDate = target.value;
    } else if (target.classList.contains('end-date-input')) {
        project.areas[areaIndex].tasks[taskIndex].endDate = target.value;
    }
    saveProjects();
}, 500));


// Views
document.getElementById('report-view-btn').addEventListener('click', renderReportView);
document.getElementById('calendars-view-btn').addEventListener('click', () => window.location.href = 'dashboard.html');
document.getElementById('legend-view-btn').addEventListener('click', renderLegendView);
document.getElementById('download-page-btn').addEventListener('click', () => downloadPageAsImage('project-planner.png'));


const renderReportView = () => {
    const project = getActiveProject();
    if (!project) {
        viewSection.innerHTML = '<p>No project selected.</p>';
        return;
    }

    let reportHTML = '<h2>Report View</h2>';
    project.areas.forEach(area => {
        reportHTML += `<h3>${area.name}</h3>`;
        if (area.tasks.length === 0) {
            reportHTML += '<p>No tasks for this area.</p>';
        } else {
            reportHTML += `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            area.tasks.forEach(task => {
                reportHTML += `
                    <tr class="team-${task.team.toLowerCase()}">
                        <td>${task.team}</td>
                        <td>${task.startDate}</td>
                        <td>${task.endDate}</td>
                    </tr>
                `;
            });
            reportHTML += `
                    </tbody>
                </table>
            `;
        }
    });
    viewSection.innerHTML = reportHTML;
};

const renderLegendView = () => {
    const legendHTML = `
        <h2>Legend View</h2>
        <div class="legend-item">
            <div class="legend-color team-gypsum"></div><span>Gypsum Team</span>
        </div>
        <div class="legend-item">
            <div class="legend-color team-ac"></div><span>AC Team</span>
        </div>
        <div class="legend-item">
            <div class="legend-color team-wiring"></div><span>Wiring Team</span>
        </div>
        <div class="legend-item">
            <div class="legend-color team-plumbing"></div><span>Plumbing Team</span>
        </div>
    `;
    viewSection.innerHTML = legendHTML;
};

document.addEventListener('DOMContentLoaded', loadProjects);
