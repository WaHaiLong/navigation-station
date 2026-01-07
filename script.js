// 从localStorage加载网站列表
let sites = JSON.parse(localStorage.getItem('sites')) || [];

// DOM元素
const sitesContainer = document.getElementById('sitesContainer');
const toggleAddBtn = document.getElementById('toggleAddBtn');
const addForm = document.getElementById('addForm');
const nameInput = document.getElementById('nameInput');
const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');

// 拖拽相关变量
let isDragging = false;
let currentCard = null;
let offsetX = 0;
let offsetY = 0;
let currentIndex = -1;

// 初始化
renderSites();
initDragAndDrop();

// 切换添加表单
toggleAddBtn.addEventListener('click', () => {
    addForm.classList.toggle('hidden');
});

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
    const x = parseInt(currentCard.style.left);
    const y = parseInt(currentCard.style.top);
    
    if (sites[currentIndex]) {
        sites[currentIndex].x = x;
        sites[currentIndex].y = y;
        saveSites();
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
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
