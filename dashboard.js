import { downloadPageAsImage } from './utils.js';

const calendarsContainer = document.getElementById('calendars-container');
const storageKey = 'gypsumProjectPlannerData';

const loadDashboard = () => {
    const data = localStorage.getItem(storageKey);
    if (!data) return;

    const projects = JSON.parse(data);
    const allTasks = projects.flatMap(p => p.areas.flatMap(a => a.tasks));
    const teams = [...new Set(allTasks.map(t => t.team))].filter(team => team);

    if (teams.length > 0) {
        renderCalendars(teams, allTasks, projects);
    } else {
        calendarsContainer.innerHTML = '<p>No tasks found to display.</p>';
    }
};

const renderCalendars = (teams, allTasks, projects) => {
    calendarsContainer.innerHTML = '';
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    teams.forEach(team => {
        const teamCalendar = document.createElement('div');
        teamCalendar.className = 'calendar';
        teamCalendar.innerHTML = `
            <div class="calendar-header">
                <h3>${team} Team</h3>
                <h4>${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
            </div>
            <div class="calendar-grid">
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
            </div>
        `;
        const calendarGrid = teamCalendar.querySelector('.calendar-grid');
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.innerHTML += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const formattedDate = date.toISOString().slice(0, 10);
            const tasksOnDay = allTasks.filter(t => t.team === team && formattedDate >= t.startDate && formattedDate <= t.endDate);

            const dayDiv = document.createElement('div');
            dayDiv.className = `day ${tasksOnDay.length > 0 ? `has-task team-${team.toLowerCase()}` : ''} ${date.toDateString() === today.toDateString() ? 'today' : ''}`;
            dayDiv.innerText = day;

            if (tasksOnDay.length > 0) {
                dayDiv.addEventListener('click', () => {
                    const taskDetails = tasksOnDay.map(t => {
                        const projectName = projects.find(p => p.areas.some(a => a.tasks.some(task => task.id === t.id)))?.name || 'Unknown Project';
                        const areaName = projects.flatMap(p => p.areas).find(a => a.tasks.some(task => task.id === t.id))?.name || 'Unknown Area';
                        return `Project: ${projectName}\nArea: ${areaName}\nStart: ${t.startDate}\nEnd: ${t.endDate}`;
                    }).join('\n\n');
                    alert(`Tasks for ${team} on ${formattedDate}:\n\n${taskDetails}`);
                });
            }
            calendarGrid.appendChild(dayDiv);
        }

        calendarsContainer.appendChild(teamCalendar);
    });
};

document.getElementById('download-dashboard-btn').addEventListener('click', () => downloadPageAsImage('team-dashboard.png'));
document.addEventListener('DOMContentLoaded', loadDashboard);
