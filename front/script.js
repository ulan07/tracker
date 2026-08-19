// DOM ЭЛЕМЕНТЫ 
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const currentDate = document.getElementById('currentDate');
const completedCount = document.getElementById('completedCount');
const totalCount = document.getElementById('totalCount');
const clearBtn = document.getElementById('clearBtn');
const filterAll = document.getElementById('filterAll');
const filterActive = document.getElementById('filterActive');
const filterCompleted = document.getElementById('filterCompleted');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarTitle = document.getElementById('calendarTitle');
const streakCount = document.getElementById('streakCount');
const totalDayTime = document.getElementById('totalDayTime');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const dayNotesInput = document.getElementById('dayNotesInput');
const notesWidget = document.getElementById('notesWidget');
const toggleNotesBtn = document.getElementById('toggleNotesBtn');
const tabTasksBtn = document.querySelector('[data-tab="tasks"]');
const tabStatsBtn = document.querySelector('[data-tab="stats"]');
const sidebarTasksPanel = document.getElementById('sidebar-tasks-panel');
const sidebarStatsPanel = document.getElementById('sidebar-stats-panel');
const contentTasksPanel = document.getElementById('tasks-content-panel');
const contentStatsPanel = document.getElementById('stats-content-panel');
const viewFullStatsBtn = document.getElementById('viewFullStatsBtn');
const backToTasksBtn = document.getElementById('backToTasksBtn');
const sidebarWeekTotal = document.getElementById('sidebarWeekTotal');
const sidebarWeekAvg = document.getElementById('sidebarWeekAvg');
const sidebarBestDay = document.getElementById('sidebarBestDay');
const statsWeekTotal = document.getElementById('statsWeekTotal');
const statsBestDay = document.getElementById('statsBestDay');
const statsAvgDay = document.getElementById('statsAvgDay');
const statsWeekChange = document.getElementById('statsWeekChange');
const statsBestDayDate = document.getElementById('statsBestDayDate');
const taskCompletionChart = document.getElementById('taskCompletionChart');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInp = document.getElementById('importFileInp');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const authBlock = document.getElementById('authBlock');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const authPassword = document.getElementById('authPassword');
const authEmail = document.getElementById('authEmail');
const logoutBtn = document.getElementById('logoutBtn');

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ 
let history = {};
let displayYear = new Date().getFullYear();
let displayMonth = new Date().getMonth();
let currentDayKey = getTodaykey();
let selectedDay = currentDayKey;
let tasks = [];
let activeIntervals = {};
let currentFilter = 'All';
let isStreakAlertSent = false;

// Звуки
const successSound = new Audio('_success_bell.wav');
const clickSound = new Audio('timerstart.wav');
const alertSound = new Audio('alert.mp3');

// Загрузка истории из localStorage
const saved = localStorage.getItem('history');
if (saved) {
    history = JSON.parse(saved);
}

// Инициализация текущего дня
if (history[selectedDay] == undefined) {
    history[selectedDay] = {
        tasks: [],
        totalTime: 0,
        status: "red",
        dayNotes: ""
    };
}

tasks = history[selectedDay].tasks;

// УТИЛИТЫ

// Получить ключ сегодняшнего дня (YYYY-MM-DD)
function getTodaykey() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Сохранить данные в localStorage
function saveTasks() {
    localStorage.setItem('history', JSON.stringify(history));
}

// Показываем текущую дату
function updateDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    currentDate.textContent = today.toLocaleDateString("ru-RU", options);
}

// добавляем задачу
function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText=='') {
        alert('Пожалуйста, введите задачу.');
        return;
    }

    const task ={
        id: Date.now(),
        text: taskText,
        completed: false,
        isEditing: false,

        seconds: 0,
        isTrunning: false,
        startTime: null
    };

    tasks.push(task);
    saveTasks();
    taskInput.value = '';
    renderTasks();
    updateDayStatus();
    syncDayWithServer();
}

function renderTasks() {
    tasksList.innerHTML = '';

    const isToday = (selectedDay === getTodaykey());
    const isEditable = (selectedDay >= getTodaykey()); 

    const taskInputBlock = document.querySelector('.task-input');
    taskInputBlock.style.display = isEditable ? 'flex' : 'none';

    let filteredTasks= [];

    if(currentFilter=='All'){
        filteredTasks=tasks;
    }
    else if(currentFilter=='Active'){
        filteredTasks=tasks.filter(t=>t.completed==false);
    }
    else{
        filteredTasks=tasks.filter(t=>t.completed==true);
    }
    if(isEditable){
        filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className='task-item';
        if(task.completed){
            li.classList.add('completed');
        }

        if(!task.isEditing){
            li.innerHTML = `
                <div class="task-main">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    <div class="task-actions">
                        <button class="Edit-btn">Редактировать</button>
                        <button class="delete-btn">Удалить</button>
                    </div>
                </div>
                ${isToday ? `
                <div class="task-timer">
                    <span class="task-seconds">${greatTime(task.seconds)}</span>
                    <button class="start-btn">${task.isTrunning ? '❚❚' : '▶'}</button>
                    <button class="stop-btn">◼</button>
                </div>
                ` : ''}
            `;
            const editBtn=li.querySelector('.Edit-btn');
            editBtn.addEventListener('click',()=>editTask(task.id));

            if(isToday){
                const startBtn=li.querySelector('.start-btn');
                startBtn.addEventListener('click', ()=>startTask(task.id));
                
                const stopBtn=li.querySelector('.stop-btn');
                stopBtn.addEventListener('click', ()=>stopTask(task.id));
            }
        }
        else{
            li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <input type="text" class="edit-input" value="${task.text}">
                <button class="Save-btn">Сохранить</button>
                <button class="delete-btn">Удалить</button>
            `;
            const editInput = li.querySelector('.edit-input');
            const saveBtn=li.querySelector('.Save-btn');
            saveBtn.addEventListener('click',()=>saver(task.id, editInput.value));
        }

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change',() => toggleTask(task.id));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click',() => deleteTask(task.id));

        tasksList.appendChild(li);})
    }
    else{
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) {
                li.classList.add('completed');
            } else {
                li.classList.add('failed');
            }

            li.innerHTML = `
                <div class="task-main">
                    <span class="task-status-icon">${task.completed ? '✔' : '✖'}</span>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-timer-readonly">
                    <span class="task-seconds">${greatTime(task.seconds)}</span>
                </div>
            `;

            tasksList.appendChild(li);
        });
    }
    

    updateStats();
    
}

function startTask(id){
    const task = tasks.find(t=>t.id===id);
    if(!task.isTrunning){
        task.isTrunning=true;
        task.baseSeconds = task.seconds; // Сохраняем базовое время перед запуском
        task.startTime = Date.now();
        activeIntervals[task.id]=setInterval(() => {
            const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
            task.seconds = task.baseSeconds + elapsed;
            saveTasks();
            renderTasks();
        },1000);
        clickSound.play();
    }
    else{
        task.isTrunning=false;
        clearInterval(activeIntervals[task.id]);
        clickSound.play();
        saveTasks();
        renderTasks();
    }
}

function initTimers() {
    tasks.forEach(task => {
        if (task.isTrunning) {
            const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
            task.seconds = task.baseSeconds + elapsed;
            saveTasks();

            activeIntervals[task.id] = setInterval(() => {
                const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
                task.seconds = task.baseSeconds + elapsed;
                saveTasks();
                renderTasks();
            }, 1000);
        }
    });
}

function stopTask(id){
    const task = tasks.find(t=>t.id===id);
    task.isTrunning=false;
    clearInterval(activeIntervals[task.id]);
    task.seconds=0;
    saveTasks();
    renderTasks();
}

function greatTime(time){
    let tH=Math.floor(time / 3600);
    let tM=Math.floor((time % 3600)/60);
    let tS=time%60;
    let h=String(tH).padStart(2, '0');
    let m=String(tM).padStart(2, '0');
    let s=String(tS).padStart(2, '0');
    return h+":"+m+":"+s;
}

function editTask(id){
    const task = tasks.find(t=>t.id===id);
    task.isEditing=true;
    renderTasks();

}

function saver(id, oldtxt){
    const task = tasks.find(t=>t.id===id);
    if(oldtxt!=''){
        task.text=oldtxt.trim();
        task.isEditing=false;
        saveTasks();
        renderTasks();
    }
    else{
        task.isEditing=false;
        saveTasks();
        renderTasks();
    }
}


function toggleTask(id){
    const task = tasks.find(t =>t.id===id);
    if(task){
        task.completed = !task.completed;
        if(task.completed) successSound.play();
        saveTasks();
        renderTasks();
        updateDayStatus();
        syncDayWithServer();
    }

}

function deleteTask(id){
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks.splice(index, 1);
    }
    updateDayStatus();
    saveTasks();
    renderTasks();
}

function clear(){
    tasks.length = 0;
    
    history[selectedDay].status = "red"; 
    saveTasks();
    updateDayStatus();
    renderTasks();
}

function updateDayStatus(){
    const total= tasks.length;
    const completed = tasks.filter(t=>t.completed).length;
    if(total==0){
        history[selectedDay].status="red";
    }
    else if(completed==total){
        history[selectedDay].status="green";
    }
    else if(completed>0){
        history[selectedDay].status="yellow";
    }
    else{
        history[selectedDay].status="red";
    }
    saveTasks();
    renderCalendar();
}

function updateStats() {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;

    completedCount.textContent = completed;
    totalCount.textContent = total;
    streakCount.textContent=calculateStreak();
    updateTotalDayTime();
    totalDayTime.textContent=greatTime(history[selectedDay].totalTime);
}

function updateTotalDayTime() {
    let dayTime=0;
    tasks.forEach(task => {
        dayTime+=task.seconds;
    });
    history[selectedDay].totalTime = dayTime;
    syncDayWithServer();
}

function fAll(){
    currentFilter = 'All';
    updateFilterButtons();
    renderTasks();
}

function fActive(){
    currentFilter = 'Active';
    updateFilterButtons();
    renderTasks();
}

function fCompleted(){
    currentFilter = 'Completed';
    updateFilterButtons();
    renderTasks();
}

function updateFilterButtons(){
    filterAll.classList.remove('active');
    filterActive.classList.remove('active');
    filterCompleted.classList.remove('active');

    if(currentFilter === 'All'){
        filterAll.classList.add('active');
    }
    else if(currentFilter === 'Active'){
        filterActive.classList.add('active');
    }
    else if(currentFilter === 'Completed'){
        filterCompleted.classList.add('active');
    }
}

// События
logoutBtn.addEventListener('click',()=>{
    localStorage.removeItem('authToken');
    localStorage.removeItem('history');
    location.reload();
})
importFileInp.addEventListener('change', importData);
importBtn.addEventListener('click', () => importFileInp.click());
exportBtn.addEventListener('click',()=> exportData());
tabTasksBtn.addEventListener('click',()=> switchTab('tasks'));
tabStatsBtn.addEventListener('click',()=>switchTab('stats'));
viewFullStatsBtn.addEventListener('click',()=>switchTab('stats'));
backToTasksBtn.addEventListener('click',()=> switchTab('tasks'));
toggleNotesBtn.addEventListener('click',()=> {
    notesWidget.classList.toggle('collapsed');
})
saveNotesBtn.addEventListener('click', ()=> saveNote());
filterAll.addEventListener('click',fAll);
filterCompleted.addEventListener('click',fCompleted);
filterActive.addEventListener('click',fActive);
clearBtn.addEventListener('click', clear);
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
themeToggleBtn.addEventListener('click',()=>{
    document.body.classList.toggle('light-theme');

    const isLight=document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});
clearHistoryBtn.addEventListener('click', clearHistory);

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Этот колбэк выполнится, когда файл полностью прочитается в RAM
    reader.onload = function(e) {
        try {
            // e.target.result содержит сырой текст из файла JSON
            const parsedData = JSON.parse(e.target.result);
            

            Object.keys(parsedData).forEach(dayKey => {
            if (!history[dayKey]) {
                history[dayKey] = parsedData[dayKey];
            } else {

                history[dayKey].tasks = [...history[dayKey].tasks, ...parsedData[dayKey].tasks];

                history[dayKey].totalTime += parsedData[dayKey].totalTime;
    
                history[dayKey].status = parsedData[dayKey].status;
            }
        });
            saveTasks();
            if (!history[selectedDay]) {
                history[selectedDay] = {
                    tasks: [],
                    totalTime: 0,
                    status: "red",
                    dayNotes: ""
                };
            }


            tasks = history[selectedDay].tasks;


            renderCalendar();
            renderTasks();
            alert('Данные успешно импортированы!');
        } catch (error) {
            alert('Ошибка при чтении файла. Убедитесь, что это валидный JSON бэкапа.');
        }
    };

    reader.readAsText(file);
}


function exportData(){
    const datastr= JSON.stringify(history, null, 2);
    const dataBlob=new Blob([datastr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discipline-tracker-backup-${getTodaykey()}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function clearHistory() {
    if (confirm('Вы уверены? Это удалит ВСЮ историю безвозвратно!')) {
        history = {};
        history[currentDayKey] = {
            tasks: [],
            totalTime: 0,
            status: "red",
            dayNotes: ""
        };
        tasks = history[currentDayKey].tasks;
        selectedDay = currentDayKey;

        saveTasks();
        renderCalendar();
        renderTasks();
        updateStats();
        updateStreak();
        alert('История полностью очищена!');
    }
}

function saveNote() {
    const saveN=dayNotesInput.value.trim();
    history[selectedDay].dayNotes=saveN;
    saveTasks();
    syncDayWithServer();
}

function renderCalendar(){
    calendarGrid.innerHTML = '';
    let startDay = new Date(displayYear, displayMonth, 1).getDay();
    let dayInMonth= new Date(displayYear, displayMonth + 1, 0).getDate();

    const monthName = new Date(displayYear, displayMonth).toLocaleString('ru-RU', { month: 'long' });
    calendarTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1) + ` ${displayYear}`;

    startDay = startDay === 0 ? 7 : startDay;

    for (let i = 1; i < startDay; i++) {
        const emptySquare = document.createElement('div');
        emptySquare.className = 'calendar-day empty';
        calendarGrid.appendChild(emptySquare);
    }

    for(let day=1;day<=dayInMonth;day++){
        const formattedMonth=String(displayMonth+1).padStart(2,'0');
        const formattedDay = String(day).padStart(2,'0');
        const daykey = `${displayYear}-${formattedMonth}-${formattedDay}`;
        const status = history[daykey] ? history[daykey].status : "empty";

        const daySquare = document.createElement('div');
        daySquare.className = `calendar-day ${status}`;
        daySquare.textContent = day;
        calendarGrid.appendChild(daySquare);
        daySquare.addEventListener('click', ()=> changeDay(daykey));
    }
}

function changeDay(thatday) {
    Object.values(activeIntervals).forEach(intervalId => clearInterval(intervalId));
    activeIntervals = {};
    selectedDay=thatday;
    if(!history[selectedDay]){
        history[selectedDay]={
            tasks : [],
            totalTime : 0,
            status : "red",
            dayNotes : ""
        }
    }
    tasks = history[selectedDay].tasks;
    dayNotesInput.value = history[selectedDay].dayNotes;

    renderCalendar();
    renderTasks();
}

function calculateStreak() {
    let streak = 0;
    let daysago = 0;

    while(true) {
        const d = new Date();
        d.setDate(d.getDate()-daysago);
        const daykey=d.toISOString().split('T')[0];
        const status = history[daykey] ? history[daykey].status : 'empty';

        if(status=="green" || status=="yellow"){
            streak++;
            daysago++;
        }
        else{
            break;
        }
    }
    return streak;
}

function switchTab(tabName){
    tabTasksBtn.classList.toggle('active', tabName === 'tasks');
    tabStatsBtn.classList.toggle('active', tabName === 'stats');
    sidebarTasksPanel.classList.toggle('active', tabName === 'tasks');
    sidebarStatsPanel.classList.toggle('active', tabName === 'stats');
    contentTasksPanel.classList.toggle('active', tabName === 'tasks');
    contentStatsPanel.classList.toggle('active', tabName === 'stats');
    if (tabName === 'stats') {
        updateFullStats();
    }
}

function updateFullStats(){
    let totalTimeWeek = 0;
    let maxSeconds=0;
    let bestDay="—"
    
    for(let i=0;i<7;i++){
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        if(history[dayKey]){
            totalTimeWeek+=history[dayKey].totalTime;
            if(history[dayKey].totalTime>maxSeconds){
                maxSeconds=history[dayKey].totalTime;
                bestDay=dayKey;
            }
        }
    }

    let prevWeekSeconds = 0;
    for (let i = 7; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        if (history[dayKey]) {
            prevWeekSeconds += history[dayKey].totalTime;
        }
    }

    let diffWeeks=totalTimeWeek-prevWeekSeconds;
    let diffsign="+";
    if(diffWeeks<0){
        diffsign="-";
    }

    let avg=Math.floor(totalTimeWeek/7);

    statsWeekChange.textContent=diffsign+greatTime(Math.abs(diffWeeks));
    sidebarWeekAvg.textContent=greatTime(avg);
    statsAvgDay.textContent=greatTime(avg);
    sidebarBestDay.textContent=greatTime(maxSeconds);
    statsBestDay.textContent=greatTime(maxSeconds);
    statsBestDayDate.textContent=bestDay;
    sidebarWeekTotal.textContent=greatTime(totalTimeWeek);
    statsWeekTotal.textContent=greatTime(totalTimeWeek);

    taskCompletionChart.innerHTML = '';

    for (let i = 6; i >= 0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
        let completedtask=0;
        let totaltask=0;
        if(history[dayKey]){
            history[dayKey].tasks.forEach(task=>{
                if(task.completed){
                    completedtask++;
                }
                totaltask++;
            })
        }
        let percentage=0;
        if(totaltask>0){
            percentage=Math.floor((completedtask/totaltask)*100);
        }

        const barWrapper = document.createElement('div');
        barWrapper.className = 'chart-bar-wrapper';

        barWrapper.innerHTML = `
            <div class="chart-bar-label">${dayName}</div>
            <div class="chart-bar" style="--bar-width: ${percentage}%">
                <span class="chart-bar-percentage">${percentage}%</span>
            </div>
        `;

        taskCompletionChart.appendChild(barWrapper);
    }
    

}

function checkStreakDanger(){
    const thatHour = new Date().getHours();
    if(thatHour < 23 && isStreakAlertSent) {
        isStreakAlertSent = false;
    }
    if(thatHour>=23 && history[currentDayKey].status=="red" && !isStreakAlertSent){
        if (Notification.permission === "granted") {
            new Notification("🔥 Дисциплина под угрозой!", {
                body: "Уже поздно, а у тебя горит красный день. Сделай хотя бы одну задачу!",
                tag: "streak-alert"
            });
        }
        isStreakAlertSent=true;
        alertSound.play();
    }
}

if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
setInterval(checkStreakDanger,300000);

function checkToken(){
    const token = localStorage.getItem('authToken');
    if(token){
        authBlock.style.display = 'none';
        loadHistoryFromServer();
    } else {
        authBlock.style.display = 'flex';
    }
}

async function addAccount(){
    const login = authEmail.value.trim();
    const password = authPassword.value.trim();

    if(login=='' || password==''){
        alert('введи логин и пароль!');
    }

    console.log(login,password);

    const url = '/api/auth/register';
    const sets = { email: login, password: password };
    try{
        const response = await fetch(url, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json' 
            },
        body: JSON.stringify(sets)
        });
        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Success:', result);
        
    }
    catch(error){
        console.error('Submission failed:', error);
    }
}

registerBtn.addEventListener('click',()=> addAccount());
loginBtn.addEventListener('click',()=> loginAccount());

async function loginAccount(){
    const login = authEmail.value.trim();
    const password = authPassword.value.trim();

    if(login=='' || password==''){
        alert('введи логин и пароль!');
    }
    const url = '/api/auth/login';
    const sets = { email: login, password: password };
    try{
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(sets)
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message);
            return;
        }
        const result = await response.json();
        console.log('Success:', result);
        localStorage.setItem('authToken',result.token);
        checkToken();

    }
    catch(error){
        console.error('Submission failed:', error);
    }
}

async function syncDayWithServer() {
    const token = localStorage.getItem('authToken');
    if(!token) return;

    const dateHistory = history[selectedDay];
    const payload = {
        date: selectedDay,
        status: dateHistory.status,
        dayNotes: dateHistory.dayNotes,
        tasks: dateHistory.tasks,
        totalTime: dateHistory.totalTime || 0
    }
    
    console.log('Готовим к отправке в облако:', payload);

    const url = '/api/history/save';

    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify(payload)
        })
    }
    catch(error){
        console.log(error);
    }
}

async function loadHistoryFromServer() {
    try {
        history = {};
        const token = localStorage.getItem('authToken');
        if (!token) return; 

        if (!token || token === 'null' || token === 'undefined') {
            history = {}; 
            renderTasks();
            renderCalendar();
            return; 
        }

        const response = await fetch('/api/history/load', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Скачали историю с сервера:', result.history);
            
            const serverHistory = {};

            result.history.forEach(day=>{
                serverHistory[day.date]={
                    status: day.status,
                    dayNotes: day.dayNotes,
                    tasks: day.tasks,
                    totalTime: day.totalTime || 0
                };
            });
            history=serverHistory;

            if(!history[selectedDay]){
                history[selectedDay]={
                    tasks: [],
                    totalTime: 0,
                    status: "red",
                    dayNotes: ""
                };
            }
            tasks = history[selectedDay].tasks;
            dayNotesInput.value = history[selectedDay].dayNotes;

            renderTasks();
            renderCalendar();
        }
    } catch (error) {
        console.error('Не удалось загрузить историю:', error);
    }
}


// Инициализация
if(localStorage.getItem('theme') === 'light'){
    document.body.classList.add('light-theme');
}
dayNotesInput.value = history[selectedDay].dayNotes;
updateDate();
initTimers();
renderTasks();
renderCalendar();
checkToken();

prevMonthBtn.addEventListener('click', () => {
    displayMonth--;
    if(displayMonth < 0){
        displayMonth = 11;
        displayYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    displayMonth++;
    if(displayMonth > 11){
        displayMonth = 0;
        displayYear++;
    }
    renderCalendar();
});