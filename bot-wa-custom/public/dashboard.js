class Dashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.currentSection = 'overview';
        this.botStatus = {
            connected: false,
            authenticated: false,
            connectionTime: null,
            messagesProcessed: 0,
            errors: 0,
            lastActivity: null
        };
        this.activityBuffer = [];
        this.maxActivityItems = 50;
    }

    init() {
        console.log('🚀 Initializing WhatsApp Bot Dashboard...');

        this.setupSocketConnection();
        this.setupEventListeners();
        this.setupCharts();
        this.startTimeUpdater();
        this.loadInitialData();

        console.log('✅ Dashboard initialized successfully');
    }

    setupSocketConnection() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('📡 Connected to server');
            this.updateConnectionIndicator(true);
            this.addActivity('info', 'Dashboard connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('📡 Disconnected from server');
            this.updateConnectionIndicator(false);
            this.addActivity('error', 'Dashboard disconnected from server');
        });

        this.socket.on('botStatus', (status) => {
            console.log('🤖 Bot status update:', status);
            this.updateBotStatus(status);
        });

        this.socket.on('pairingCode', (data) => {
            console.log('🔐 Pairing code received:', data);
            this.showPairingCode(data.code, data.phoneNumber);
        });

        this.socket.on('activityUpdate', (activity) => {
            this.addActivity(activity.type, activity.message, activity.data);
        });

        this.socket.on('error', (error) => {
            console.error('🚨 Socket error:', error);
            this.addActivity('error', `Socket error: ${error.message}`);
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Refresh data button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.loadInitialData();
            this.addActivity('info', 'Data refreshed manually');
        });

        // Restart bot button
        document.getElementById('restartBot').addEventListener('click', () => {
            this.restartBot();
        });

        // Refresh logs button
        document.getElementById('refreshLogs').addEventListener('click', () => {
            this.loadLogs();
        });
    }

    setupCharts() {
        // Message Activity Chart
        const messageCtx = document.getElementById('messageChart');
        if (messageCtx) {
            this.charts.messageChart = new Chart(messageCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Messages',
                        data: [],
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        // Command Usage Chart
        const commandCtx = document.getElementById('commandChart');
        if (commandCtx) {
            this.charts.commandChart = new Chart(commandCtx, {
                type: 'doughnut',
                data: {
                    labels: ['/help', '/ai', '/yt', '/search', '/menu'],
                    datasets: [{
                        data: [12, 19, 8, 5, 15],
                        backgroundColor: [
                            '#0d6efd',
                            '#198754',
                            '#ffc107',
                            '#dc3545',
                            '#6f42c1'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            this.charts.performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: [],
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        if (sectionName === 'logs') {
            this.loadLogs();
        } else if (sectionName === 'users') {
            this.loadUsers();
        } else if (sectionName === 'analytics') {
            this.updateCharts();
        }
    }

    updateBotStatus(status) {
        this.botStatus = { ...this.botStatus, ...status };

        // Update connection status
        const statusText = document.getElementById('connectionStatusText');
        const statusBadge = document.getElementById('connectionStatus');
        const detailedStatus = document.getElementById('detailedConnectionStatus');

        if (status.connected) {
            if (statusText) statusText.textContent = 'Connected';
            if (statusBadge) {
                statusBadge.className = 'badge bg-success ms-2';
                statusBadge.textContent = '●';
            }
            if (detailedStatus) {
                detailedStatus.className = 'badge bg-success';
                detailedStatus.textContent = 'Connected';
            }
        } else {
            if (statusText) statusText.textContent = 'Disconnected';
            if (statusBadge) {
                statusBadge.className = 'badge bg-danger ms-2';
                statusBadge.textContent = '●';
            }
            if (detailedStatus) {
                detailedStatus.className = 'badge bg-danger';
                detailedStatus.textContent = 'Disconnected';
            }
        }

        // Update message count
        const messagesElement = document.getElementById('messagesProcessed');
        if (messagesElement && status.messagesProcessed !== undefined) {
            messagesElement.textContent = status.messagesProcessed.toLocaleString();
        }

        // Update error count
        const errorsElement = document.getElementById('errorCount');
        if (errorsElement && status.errors !== undefined) {
            errorsElement.textContent = status.errors.toLocaleString();
        }

        // Update connection time
        const connectionTimeElement = document.getElementById('connectionTime');
        if (connectionTimeElement && status.connectionTime) {
            connectionTimeElement.textContent = new Date(status.connectionTime).toLocaleString();
        }

        // Update last activity
        const lastActivityElement = document.getElementById('lastActivity');
        if (lastActivityElement && status.lastActivity) {
            lastActivityElement.textContent = this.formatRelativeTime(new Date(status.lastActivity));
        }
    }

    showPairingCode(code, phoneNumber) {
        const alert = document.getElementById('pairingAlert');
        const codeElement = document.getElementById('pairingCode');

        if (alert && codeElement) {
            codeElement.textContent = code;
            alert.style.display = 'block';
            alert.classList.add('show');

            this.addActivity('warning', `Pairing code generated: ${code} for ${phoneNumber}`);
        }
    }

    addActivity(type, message, data = null) {
        const activity = {
            type,
            message,
            data,
            timestamp: new Date()
        };

        this.activityBuffer.unshift(activity);

        // Keep only last N items
        if (this.activityBuffer.length > this.maxActivityItems) {
            this.activityBuffer = this.activityBuffer.slice(0, this.maxActivityItems);
        }

        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const feedElement = document.getElementById('activityFeed');
        if (!feedElement) return;

        if (this.activityBuffer.length === 0) {
            feedElement.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i data-feather="loader" class="me-2"></i>
                    Waiting for activity...
                </div>
            `;
            try {
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            } catch (error) {
                console.warn('Feather icons not available:', error);
            }
            return;
        }

        const html = this.activityBuffer.map(activity => {
            const icon = this.getActivityIcon(activity.type);
            const badgeClass = this.getActivityBadgeClass(activity.type);
            const timeStr = activity.timestamp.toLocaleTimeString();

            return `
                <div class="d-flex align-items-start mb-2 pb-2 border-bottom border-dark">
                    <span class="badge ${badgeClass} me-2 mt-1">
                        <i data-feather="${icon}" width="12" height="12"></i>
                    </span>
                    <div class="flex-grow-1">
                        <div class="fw-medium">${this.escapeHtml(activity.message)}</div>
                        <small class="text-muted">${timeStr}</small>
                        ${activity.data ? `<div class="mt-1"><small class="text-info">${this.escapeHtml(JSON.stringify(activity.data))}</small></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        feedElement.innerHTML = html;
        try {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } catch (error) {
            console.warn('Feather icons not available:', error);
        }
    }

    getActivityIcon(type) {
        const icons = {
            info: 'info',
            success: 'check-circle',
            warning: 'alert-triangle',
            error: 'x-circle',
            message: 'message-circle',
            ai: 'cpu',
            download: 'download'
        };
        return icons[type] || 'info';
    }

    getActivityBadgeClass(type) {
        const classes = {
            info: 'bg-info',
            success: 'bg-success',
            warning: 'bg-warning',
            error: 'bg-danger',
            message: 'bg-primary',
            ai: 'bg-secondary',
            download: 'bg-dark'
        };
        return classes[type] || 'bg-secondary';
    }

    startTimeUpdater() {
        const updateTime = () => {
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = new Date().toLocaleString();
            }

            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = 'Live';
            }
        };

        updateTime();
        setInterval(updateTime, 1000);

        // Update uptime
        const updateUptime = () => {
            const uptimeElement = document.getElementById('uptimeDisplay');
            if (uptimeElement) {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.uptime) {
                            uptimeElement.textContent = this.formatDuration(data.uptime);
                        }

                        if (data.memory) {
                            const memUsage = document.getElementById('memoryUsage');
                            const memProgress = document.getElementById('memoryProgress');

                            if (memUsage && memProgress) {
                                const usedMB = Math.round(data.memory.heapUsed / 1024 / 1024);
                                const totalMB = Math.round(data.memory.heapTotal / 1024 / 1024);
                                const percentage = Math.round((usedMB / totalMB) * 100);

                                memUsage.textContent = `${usedMB} MB`;
                                memProgress.style.width = `${percentage}%`;

                                if (percentage > 80) {
                                    memProgress.className = 'progress-bar bg-danger';
                                } else if (percentage > 60) {
                                    memProgress.className = 'progress-bar bg-warning';
                                } else {
                                    memProgress.className = 'progress-bar bg-info';
                                }
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching status:', error);
                    });
            }
        };

        updateUptime();
        setInterval(updateUptime, 5000);
    }

    loadInitialData() {
        console.log('📊 Loading initial data...');

        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    this.updateBotStatus(data.status);
                }
                this.addActivity('success', 'Initial data loaded');
            })
            .catch(error => {
                console.error('Error loading initial data:', error);
                this.addActivity('error', `Failed to load initial data: ${error.message}`);
            });
    }

    loadLogs() {
        const logsContainer = document.getElementById('logsContainer');
        if (!logsContainer) return;

        logsContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i data-feather="loader" class="me-2"></i>
                Loading logs...
            </div>
        `;
        try {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } catch (error) {
            console.warn('Feather icons not available:', error);
        }

        fetch('/api/logs')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.logs) {
                    const logsHtml = data.logs.map(log => {
                        try {
                            const logObj = JSON.parse(log);
                            const level = logObj.level || 'info';
                            const message = logObj.message || log;
                            const timestamp = logObj.timestamp || new Date().toISOString();

                            const levelBadge = this.getLogLevelBadge(level);

                            return `
                                <div class="log-entry mb-1">
                                    <span class="badge ${levelBadge} me-2">${level.toUpperCase()}</span>
                                    <span class="text-muted me-2">${new Date(timestamp).toLocaleString()}</span>
                                    <span>${this.escapeHtml(message)}</span>
                                </div>
                            `;
                        } catch (e) {
                            return `
                                <div class="log-entry mb-1">
                                    <span class="badge bg-secondary me-2">RAW</span>
                                    <span>${this.escapeHtml(log)}</span>
                                </div>
                            `;
                        }
                    }).join('');

                    logsContainer.innerHTML = logsHtml || '<div class="text-muted">No logs available</div>';

                    // Scroll to bottom
                    logsContainer.scrollTop = logsContainer.scrollHeight;
                } else {
                    logsContainer.innerHTML = '<div class="text-muted">No logs available</div>';
                }
            })
            .catch(error => {
                console.error('Error loading logs:', error);
                logsContainer.innerHTML = `<div class="text-danger">Error loading logs: ${error.message}</div>`;
            });
    }

    getLogLevelBadge(level) {
        const badges = {
            error: 'bg-danger',
            warn: 'bg-warning',
            info: 'bg-info',
            debug: 'bg-secondary',
            verbose: 'bg-light text-dark'
        };
        return badges[level] || 'bg-secondary';
    }

    loadUsers() {
        const usersTable = document.getElementById('usersTable');
        if (!usersTable) return;

        usersTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i data-feather="loader" class="me-2"></i>
                    Loading users...
                </td>
            </tr>
        `;
        try {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        } catch (error) {
            console.warn('Feather icons not available:', error);
        }

        // For now, show a message that this feature requires database access
        setTimeout(() => {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i data-feather="info" class="me-2"></i>
                        User data will be displayed when users start interacting with the bot
                    </td>
                </tr>
            `;
            try {
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            } catch (error) {
                console.warn('Feather icons not available:', error);
            }
        }, 1000);
    }

    updateCharts() {
        // Update charts with real data when available
        console.log('📊 Updating charts...');

        // For now, generate some sample data for demonstration
        const times = [];
        const messageData = [];
        const performanceData = [];

        for (let i = 11; i >= 0; i--) {
            const time = new Date();
            time.setHours(time.getHours() - i);
            times.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            messageData.push(Math.floor(Math.random() * 10) + 1);
            performanceData.push(Math.floor(Math.random() * 200) + 50);
        }

        if (this.charts.messageChart) {
            this.charts.messageChart.data.labels = times;
            this.charts.messageChart.data.datasets[0].data = messageData;
            this.charts.messageChart.update();
        }

        if (this.charts.performanceChart) {
            this.charts.performanceChart.data.labels = times;
            this.charts.performanceChart.data.datasets[0].data = performanceData;
            this.charts.performanceChart.update();
        }
    }

    restartBot() {
        if (confirm('Are you sure you want to restart the bot? This will temporarily disconnect all users.')) {
            this.addActivity('warning', 'Bot restart initiated...');

            fetch('/api/restart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.addActivity('success', 'Bot restart request sent');
                } else {
                    this.addActivity('error', 'Failed to restart bot');
                }
            })
            .catch(error => {
                console.error('Error restarting bot:', error);
                this.addActivity('error', `Restart failed: ${error.message}`);
            });
        }
    }

    updateConnectionIndicator(connected) {
        const indicator = document.getElementById('connectionStatus');
        if (indicator) {
            if (connected) {
                indicator.className = 'badge bg-success ms-2';
                indicator.textContent = '●';
            } else {
                indicator.className = 'badge bg-danger ms-2';
                indicator.textContent = '●';
            }
        }
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (minutes < 1440) {
            return `${Math.floor(minutes / 60)}h ago`;
        } else {
            return `${Math.floor(minutes / 1440)}d ago`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for global use
window.Dashboard = new Dashboard();