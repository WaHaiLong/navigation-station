// 从localStorage加载网站列表
let sites = JSON.parse(localStorage.getItem('sites')) || [];

// Gist配置
const GIST_FILENAME = 'navigation-station.json';
let gistId = localStorage.getItem('gistId') || null;
let githubToken = localStorage.getItem('githubToken') || null;

// DOM元素
const sitesContainer = document.getElementById('sitesContainer');
const toggleAddBtn = document.getElementById('toggleAddBtn');
const settingsBtn = document.getElementById('settingsBtn');
const addForm = document.getElementById('addForm');
const settingsForm = document.getElementById('settingsForm');
const nameInput = document.getElementById('nameInput');
const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const githubTokenInput = document.getElementById('githubTokenInput');
const saveTokenBtn = document.getElementById('saveTokenBtn');
const syncFromGistBtn = document.getElementById('syncFromGistBtn');
const syncToGistBtn = document.getElementById('syncToGistBtn');
const clearTokenBtn = document.getElementById('clearTokenBtn');
const syncStatus = document.getElementById('syncStatus');
const gistStatus = document.getElementById('gistStatus');

// 拖拽相关变量
let isDragging = false;
let currentCard = null;
let offsetX = 0;
let offsetY = 0;
let currentIndex = -1;

// 初始化
renderSites();
initDragAndDrop();
updateSyncStatus();
loadTokenFromStorage();

// 切换添加表单
toggleAddBtn.addEventListener('click', () => {
    addForm.classList.toggle('hidden');
    if (!addForm.classList.contains('hidden')) {
        settingsForm.classList.add('hidden');
    }
});

// 切换设置表单
settingsBtn.addEventListener('click', () => {
    settingsForm.classList.toggle('hidden');
    if (!settingsForm.classList.contains('hidden')) {
        addForm.classList.add('hidden');
    }
});

// 保存Token
saveTokenBtn.addEventListener('click', saveToken);

// 同步操作
syncFromGistBtn.addEventListener('click', syncFromGist);
syncToGistBtn.addEventListener('click', syncToGist);
clearTokenBtn.addEventListener('click', clearToken);

// 添加网站
addBtn.addEventListener('click', addSite);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
});
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
});

// 渲染网站列表
function renderSites() {
    sitesContainer.innerHTML = '';

    if (sites.length === 0) {
        sitesContainer.innerHTML = '<p class="empty-message">还没有添加任何网站，请点击下方按钮添加</p>';
        return;
    }

    sites.forEach((site, index) => {
        const siteCard = createSiteCard(site, index);
        sitesContainer.appendChild(siteCard);
    });
}

// 创建网站卡片
function createSiteCard(site, index) {
    const siteCard = document.createElement('div');
    siteCard.className = 'site-card';
    siteCard.dataset.index = index;
    
    // 设置位置
    if (site.x !== undefined && site.y !== undefined) {
        siteCard.style.left = site.x + 'px';
        siteCard.style.top = site.y + 'px';
    } else {
        // 默认网格布局
        const cols = Math.floor((window.innerWidth - 40) / 120);
        const row = Math.floor(index / cols);
        const col = index % cols;
        siteCard.style.left = (20 + col * 120) + 'px';
        siteCard.style.top = (20 + row * 120) + 'px';
    }
    
    const link = document.createElement('div');
    link.className = 'site-link';
    link.innerHTML = `
        <div class="site-icon">${site.icon || '🌐'}</div>
        <div class="site-name">${escapeHtml(site.name)}</div>
    `;
    
    // 双击打开网页
    link.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(site.url, '_blank');
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteSite(index);
    };
    
    siteCard.appendChild(link);
    siteCard.appendChild(deleteBtn);
    
    return siteCard;
}

// 初始化拖拽功能
function initDragAndDrop() {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// 鼠标按下
function handleMouseDown(e) {
    const card = e.target.closest('.site-card');
    if (!card || e.target.closest('.delete-btn')) {
        return;
    }
    
    e.preventDefault();
    isDragging = true;
    currentCard = card;
    currentIndex = parseInt(card.dataset.index);
    
    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    card.classList.add('dragging');
    card.style.zIndex = '1000';
}

// 鼠标移动
function handleMouseMove(e) {
    if (!isDragging || !currentCard) return;
    
    e.preventDefault();
    
    const containerRect = sitesContainer.getBoundingClientRect();
    let x = e.clientX - containerRect.left - offsetX;
    let y = e.clientY - containerRect.top - offsetY;
    
    // 限制在容器内
    const cardWidth = currentCard.offsetWidth;
    const cardHeight = currentCard.offsetHeight;
    x = Math.max(0, Math.min(x, containerRect.width - cardWidth));
    y = Math.max(0, Math.min(y, containerRect.height - cardHeight));
    
    currentCard.style.left = x + 'px';
    currentCard.style.top = y + 'px';
}

// 鼠标释放
function handleMouseUp(e) {
    if (!isDragging || !currentCard) return;
    
    isDragging = false;
    currentCard.classList.remove('dragging');
    currentCard.style.zIndex = '';
    
    // 保存位置
    const x = parseInt(currentCard.style.left) || 0;
    const y = parseInt(currentCard.style.top) || 0;
    
    if (sites[currentIndex]) {
        sites[currentIndex].x = x;
        sites[currentIndex].y = y;
        // 立即保存到localStorage
        localStorage.setItem('sites', JSON.stringify(sites));
        // 然后尝试同步到Gist（如果已配置）
        if (githubToken) {
            syncToGist(true); // 静默同步
        }
    }
    
    currentCard = null;
    currentIndex = -1;
}

// 添加网站
function addSite() {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
        alert('请填写网站名称和网址');
        return;
    }

    // 如果没有http://或https://，自动添加
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // 验证URL格式
    try {
        new URL(url);
    } catch (e) {
        alert('请输入有效的网址');
        return;
    }

    // 添加到列表
    sites.push({
        name: name,
        url: url,
        icon: '🌐',
        id: Date.now(),
        x: undefined,
        y: undefined
    });

    saveSites();
    renderSites();
    initDragAndDrop();

    // 清空输入框
    nameInput.value = '';
    urlInput.value = '';
    addForm.classList.add('hidden');
}

// 删除网站
function deleteSite(index) {
    if (!confirm(`确定要删除 "${sites[index].name}" 吗？`)) {
        return;
    }

    sites.splice(index, 1);
    saveSites();
    renderSites();
    initDragAndDrop();
}

// 保存网站列表
function saveSites() {
    localStorage.setItem('sites', JSON.stringify(sites));
    // 如果已配置Token，自动同步到Gist
    if (githubToken) {
        syncToGist(true); // 静默同步
    }
}

// 加载Token
function loadTokenFromStorage() {
    if (githubToken) {
        githubTokenInput.value = '••••••••••••';
    }
}

// 保存Token
function saveToken() {
    const token = githubTokenInput.value.trim();
    if (!token) {
        showGistStatus('请输入Token', 'error');
        return;
    }
    
    if (token === '••••••••••••') {
        showGistStatus('Token已保存', 'success');
        return;
    }
    
    githubToken = token;
    localStorage.setItem('githubToken', token);
    githubTokenInput.value = '••••••••••••';
    showGistStatus('Token已保存', 'success');
    
    // 测试Token并创建/获取Gist
    testTokenAndCreateGist();
}

// 测试Token并创建Gist
async function testTokenAndCreateGist() {
    try {
        setSyncStatus('正在验证Token...', 'syncing');
        
        // 测试Token是否有效
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Token无效');
        }
        
        // 查找或创建Gist
        if (gistId) {
            // 检查Gist是否存在
            const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!gistResponse.ok) {
                gistId = null;
                localStorage.removeItem('gistId');
            }
        }
        
        if (!gistId) {
            // 创建新Gist
            const createResponse = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Navigation Station Data',
                    public: false,
                    files: {
                        [GIST_FILENAME]: {
                            content: JSON.stringify(sites, null, 2)
                        }
                    }
                })
            });
            
            if (createResponse.ok) {
                const gist = await createResponse.json();
                gistId = gist.id;
                localStorage.setItem('gistId', gistId);
                setSyncStatus('已连接到云端', 'success');
                showGistStatus('Gist创建成功，已连接到云端', 'success');
            } else {
                throw new Error('创建Gist失败');
            }
        } else {
            setSyncStatus('已连接到云端', 'success');
            showGistStatus('Token验证成功，已连接到云端', 'success');
        }
    } catch (error) {
        setSyncStatus('连接失败', 'error');
        showGistStatus('错误: ' + error.message, 'error');
    }
}

// 从Gist同步
async function syncFromGist() {
    if (!githubToken) {
        showGistStatus('请先保存Token', 'error');
        return;
    }
    
    try {
        setSyncStatus('正在同步...', 'syncing');
        
        if (!gistId) {
            // 尝试查找用户的Gist
            const response = await fetch('https://api.github.com/gists', {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('无法获取Gist列表');
            }
            
            const gists = await response.json();
            const targetGist = gists.find(g => g.files[GIST_FILENAME]);
            
            if (targetGist) {
                gistId = targetGist.id;
                localStorage.setItem('gistId', gistId);
            } else {
                throw new Error('未找到同步数据，请先同步到云端');
            }
        }
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('无法获取Gist数据');
        }
        
        const gist = await response.json();
        const file = gist.files[GIST_FILENAME];
        
        if (!file) {
            throw new Error('Gist中未找到数据文件');
        }
        
        const remoteSites = JSON.parse(file.content);
        
        // 验证数据格式，确保位置信息存在
        const validatedSites = remoteSites.map((site, index) => {
            // 确保每个站点都有必要的数据
            if (!site.name || !site.url) {
                console.warn('站点数据不完整:', site);
                return null;
            }
            // 确保位置数据是数字类型
            if (site.x !== undefined) site.x = Number(site.x);
            if (site.y !== undefined) site.y = Number(site.y);
            return site;
        }).filter(site => site !== null);
        
        sites = validatedSites;
        
        // 先保存到localStorage
        localStorage.setItem('sites', JSON.stringify(sites));
        
        // 然后重新渲染
        renderSites();
        initDragAndDrop();
        
        setSyncStatus('同步成功', 'success');
        showGistStatus(`已从云端同步 ${sites.length} 个网站`, 'success');
    } catch (error) {
        setSyncStatus('同步失败', 'error');
        showGistStatus('错误: ' + error.message, 'error');
    }
}

// 同步到Gist
async function syncToGist(silent = false) {
    if (!githubToken) {
        if (!silent) {
            showGistStatus('请先保存Token', 'error');
        }
        return false;
    }
    
    try {
        if (!silent) {
            setSyncStatus('正在同步...', 'syncing');
        }
        
        // 确保保存了位置数据
        const sitesWithPositions = sites.map(site => {
            // 如果位置未定义，尝试从DOM获取
            if (site.x === undefined || site.y === undefined) {
                const card = document.querySelector(`[data-index="${sites.indexOf(site)}"]`);
                if (card) {
                    site.x = parseInt(card.style.left) || site.x;
                    site.y = parseInt(card.style.top) || site.y;
                }
            }
            return site;
        });
        
        if (!gistId) {
            // 创建新Gist
            const createResponse = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Navigation Station Data',
                    public: false,
                    files: {
                        [GIST_FILENAME]: {
                            content: JSON.stringify(sitesWithPositions, null, 2)
                        }
                    }
                })
            });
            
            if (createResponse.ok) {
                const gist = await createResponse.json();
                gistId = gist.id;
                localStorage.setItem('gistId', gistId);
            } else {
                const errorData = await createResponse.json().catch(() => ({}));
                throw new Error(errorData.message || '创建Gist失败');
            }
        } else {
            // 更新现有Gist
            const updateResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [GIST_FILENAME]: {
                            content: JSON.stringify(sitesWithPositions, null, 2)
                        }
                    }
                })
            });
            
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json().catch(() => ({}));
                throw new Error(errorData.message || '更新Gist失败');
            }
        }
        
        // 更新本地数据，确保位置信息已保存
        sites = sitesWithPositions;
        localStorage.setItem('sites', JSON.stringify(sites));
        
        if (!silent) {
            setSyncStatus('同步成功', 'success');
            showGistStatus('已同步到云端', 'success');
        }
        return true;
    } catch (error) {
        console.error('同步失败:', error);
        if (!silent) {
            setSyncStatus('同步失败', 'error');
            showGistStatus('错误: ' + error.message, 'error');
        } else {
            // 静默同步失败时，至少更新状态提示
            setSyncStatus('同步失败', 'error');
        }
        return false;
    }
}

// 清除Token
function clearToken() {
    if (!confirm('确定要清除Token吗？清除后将无法同步数据。')) {
        return;
    }
    
    githubToken = null;
    gistId = null;
    localStorage.removeItem('githubToken');
    localStorage.removeItem('gistId');
    githubTokenInput.value = '';
    setSyncStatus('', '');
    showGistStatus('Token已清除', 'success');
}

// 更新同步状态
function updateSyncStatus() {
    if (githubToken && gistId) {
        setSyncStatus('已连接', 'success');
    } else if (githubToken) {
        setSyncStatus('未连接', '');
    } else {
        setSyncStatus('', '');
    }
}

// 设置同步状态
function setSyncStatus(text, type) {
    syncStatus.textContent = text;
    syncStatus.className = 'sync-status ' + type;
}

// 显示Gist状态
function showGistStatus(message, type) {
    gistStatus.textContent = message;
    gistStatus.className = 'gist-status ' + type;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            gistStatus.textContent = '';
            gistStatus.className = 'gist-status';
        }, 3000);
    }
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
