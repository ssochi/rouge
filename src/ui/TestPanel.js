import { WEAPONS } from '../assets/weapons/WeaponData.js';
import { Assets } from '../graphics/Assets.js';
import { Vehicle } from '../core/entities/Vehicle.js';
import { BreakableObject } from '../core/entities/BreakableObject.js';
import { getCostumePiecesBySlot } from '../assets/characters/player/costumes/CostumeData.js';

const TABS = [
    { key: 'weapons', label: 'WEAPONS' },
    { key: 'items', label: 'ITEMS' },
    { key: 'vehicles', label: 'VEHICLES' },
    { key: 'enemies', label: 'ENEMIES' },
    { key: 'objects', label: 'OBJECTS' },
    { key: 'costumes', label: 'COSTUMES' }
];

const VEHICLE_TYPES = ['suv', 'truck', 'police'];

const ENEMY_TYPES = [
    { type: 'zombie', name: 'Zombie', hasWeapon: false },
    { type: 'zombie_female', name: 'Zombie Female', hasWeapon: false },
    { type: 'zombie_brute', name: 'Zombie Brute', hasWeapon: false },
    { type: 'hunter', name: 'Hunter', hasWeapon: true, defaultWeapon: 'default_pistol' },
    { type: 'soldier', name: 'Soldier', hasWeapon: true, defaultWeapon: 'smg' },
    { type: 'mutant_beast', name: 'Mutant Beast (BOSS)', hasWeapon: false }
];

export class TestPanel {
    constructor({ inventorySystem, worldSystem, player, costumeSystem }) {
        this.inventorySystem = inventorySystem;
        this.worldSystem = worldSystem;
        this.player = player;
        this.costumeSystem = costumeSystem;

        this.isOpen = false;
        this._activeTab = 'weapons';
        this._selectedIndex = -1;
        this._listData = [];
        this._iconCache = new Map();

        this._createDOM();
        this._switchTab('weapons');
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this._overlay.classList.remove('hidden');
            this._switchTab(this._activeTab);
        } else {
            this._overlay.classList.add('hidden');
        }
    }

    _createDOM() {
        this._overlay = document.createElement('div');
        this._overlay.id = 'test-panel-overlay';
        this._overlay.className = 'hidden';

        const win = document.createElement('div');
        win.className = 'test-panel-window';

        // Header
        const header = document.createElement('div');
        header.className = 'test-panel-header';
        header.innerHTML = '<span>DEBUG PANEL</span>';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'test-panel-close';
        closeBtn.textContent = 'X';
        closeBtn.addEventListener('click', () => this.toggle());
        header.appendChild(closeBtn);
        win.appendChild(header);

        // Tabs
        const tabBar = document.createElement('div');
        tabBar.className = 'test-panel-tabs';
        this._tabButtons = {};
        for (const tab of TABS) {
            const btn = document.createElement('button');
            btn.className = 'test-panel-tab';
            btn.textContent = tab.label;
            btn.addEventListener('click', () => this._switchTab(tab.key));
            tabBar.appendChild(btn);
            this._tabButtons[tab.key] = btn;
        }
        win.appendChild(tabBar);

        // Search
        const searchWrap = document.createElement('div');
        searchWrap.className = 'test-panel-search';
        this._searchInput = document.createElement('input');
        this._searchInput.type = 'text';
        this._searchInput.placeholder = 'Search...';
        this._searchInput.addEventListener('keydown', (e) => e.stopPropagation());
        this._searchInput.addEventListener('keyup', (e) => e.stopPropagation());
        this._searchInput.addEventListener('input', () => this._filterList());
        searchWrap.appendChild(this._searchInput);
        win.appendChild(searchWrap);

        // List
        this._listEl = document.createElement('div');
        this._listEl.className = 'test-panel-list';
        win.appendChild(this._listEl);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'test-panel-footer';

        // Enemy weapon selector
        this._weaponSelectWrap = document.createElement('div');
        this._weaponSelectWrap.className = 'enemy-weapon-select';
        const wLabel = document.createElement('label');
        wLabel.textContent = 'WEAPON:';
        this._weaponSelect = document.createElement('select');
        this._weaponSelect.addEventListener('keydown', (e) => e.stopPropagation());
        this._populateWeaponSelect();
        this._weaponSelectWrap.appendChild(wLabel);
        this._weaponSelectWrap.appendChild(this._weaponSelect);
        footer.appendChild(this._weaponSelectWrap);

        // Spawn controls
        const controls = document.createElement('div');
        controls.className = 'spawn-controls';
        const cLabel = document.createElement('label');
        cLabel.textContent = 'COUNT:';
        this._countInput = document.createElement('input');
        this._countInput.type = 'number';
        this._countInput.min = '1';
        this._countInput.max = '100';
        this._countInput.value = '1';
        this._countInput.addEventListener('keydown', (e) => e.stopPropagation());
        this._countInput.addEventListener('keyup', (e) => e.stopPropagation());
        this._spawnBtn = document.createElement('button');
        const spawnBtn = this._spawnBtn;
        spawnBtn.className = 'spawn-btn';
        spawnBtn.textContent = 'SPAWN';
        spawnBtn.addEventListener('click', () => this._spawn());
        controls.appendChild(cLabel);
        controls.appendChild(this._countInput);
        controls.appendChild(spawnBtn);
        footer.appendChild(controls);

        // Message line
        this._msgEl = document.createElement('div');
        this._msgEl.className = 'test-panel-msg';
        footer.appendChild(this._msgEl);

        win.appendChild(footer);
        this._overlay.appendChild(win);

        // Click overlay background to close
        this._overlay.addEventListener('click', (e) => {
            if (e.target === this._overlay) this.toggle();
        });

        document.getElementById('ui-layer').appendChild(this._overlay);
    }

    _populateWeaponSelect() {
        this._weaponSelect.innerHTML = '';
        for (const [id, cfg] of Object.entries(WEAPONS)) {
            if (cfg.isUtility) continue;
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = cfg.name || id;
            this._weaponSelect.appendChild(opt);
        }
    }

    _switchTab(tabKey) {
        this._activeTab = tabKey;
        this._selectedIndex = -1;
        this._searchInput.value = '';

        // Update tab button styles
        for (const [key, btn] of Object.entries(this._tabButtons)) {
            btn.classList.toggle('active', key === tabKey);
        }

        // Show/hide enemy weapon selector
        this._weaponSelectWrap.classList.toggle('visible', tabKey === 'enemies');

        // Update spawn button text for costumes tab
        const isCostume = tabKey === 'costumes';
        this._spawnBtn.textContent = isCostume ? 'ADD' : 'SPAWN';
        this._countInput.parentElement.querySelector('label').style.display = isCostume ? 'none' : '';
        this._countInput.style.display = isCostume ? 'none' : '';

        // Populate data
        this._listData = this._getTabData(tabKey);
        this._renderList(this._listData);
        this._clearMsg();
    }

    _getTabData(tabKey) {
        switch (tabKey) {
            case 'weapons': return this._getWeapons();
            case 'items': return this._getItems();
            case 'vehicles': return this._getVehicles();
            case 'enemies': return this._getEnemies();
            case 'objects': return this._getObjects();
            case 'costumes': return this._getCostumes();
            default: return [];
        }
    }

    _getWeapons() {
        const list = [];
        for (const [id, cfg] of Object.entries(WEAPONS)) {
            if (cfg.isUtility) continue;
            list.push({ id, name: cfg.name || id, subId: id, icon: cfg.sprite });
        }
        return list;
    }

    _getItems() {
        const list = [];
        for (const [id, def] of this.inventorySystem.items) {
            if (def.type === 'consumable') {
                list.push({ id, name: def.name, subId: id, icon: def.icon });
            }
        }
        return list;
    }

    _getVehicles() {
        return VEHICLE_TYPES.map(t => ({
            id: t,
            name: t.charAt(0).toUpperCase() + t.slice(1),
            subId: t,
            icon: t
        }));
    }

    _getEnemies() {
        return ENEMY_TYPES.map(e => ({
            id: e.type,
            name: e.name,
            subId: e.type,
            hasWeapon: e.hasWeapon,
            defaultWeapon: e.defaultWeapon,
            icon: e.type
        }));
    }

    _getObjects() {
        const list = [];
        for (const [id, def] of this.inventorySystem.items) {
            if (def.type === 'placeable') {
                list.push({ id, name: def.name, subId: id, icon: def.icon });
            }
        }
        return list;
    }

    _resolveIconSrc(key) {
        if (!key) return null;
        if (this._iconCache.has(key)) return this._iconCache.get(key);

        let sprite = null;
        if (Assets.objects && Assets.objects[key]) {
            sprite = Assets.objects[key];
        } else if (Assets[key]) {
            sprite = Assets[key];
        }
        if (Array.isArray(sprite)) sprite = sprite[0];

        if (sprite && sprite.toDataURL) {
            const src = sprite.toDataURL();
            this._iconCache.set(key, src);
            return src;
        }
        this._iconCache.set(key, null);
        return null;
    }

    _renderList(data) {
        this._listEl.innerHTML = '';
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const el = document.createElement('div');
            el.className = 'test-panel-item';
            if (i === this._selectedIndex) el.classList.add('selected');

            const iconSrc = this._resolveIconSrc(item.icon);
            const iconHtml = iconSrc
                ? `<img class="test-panel-item-icon" src="${iconSrc}" alt="">`
                : '<span class="test-panel-item-icon-placeholder"></span>';

            el.innerHTML = `${iconHtml}<span class="test-panel-item-name">${item.name}</span><span class="test-panel-item-id">${item.id}</span>`;
            el.addEventListener('click', () => this._selectItem(i, data));
            this._listEl.appendChild(el);
        }
    }

    _selectItem(index, data) {
        this._selectedIndex = index;
        // Update selection highlight
        const items = this._listEl.querySelectorAll('.test-panel-item');
        items.forEach((el, i) => el.classList.toggle('selected', i === index));

        // For enemies with weapons, update weapon selector default
        if (this._activeTab === 'enemies') {
            const entry = data[index];
            if (entry && entry.hasWeapon && entry.defaultWeapon) {
                this._weaponSelect.value = entry.defaultWeapon;
            }
        }

        this._clearMsg();
    }

    _filterList() {
        const query = this._searchInput.value.toLowerCase().trim();
        if (!query) {
            this._listData = this._getTabData(this._activeTab);
        } else {
            const all = this._getTabData(this._activeTab);
            this._listData = all.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query)
            );
        }
        this._selectedIndex = -1;
        this._renderList(this._listData);
    }

    _spawn() {
        if (this._selectedIndex < 0 || this._selectedIndex >= this._listData.length) {
            this._showMsg('Select an item first');
            return;
        }

        const entry = this._listData[this._selectedIndex];
        const count = Math.max(1, Math.min(100, parseInt(this._countInput.value) || 1));

        switch (this._activeTab) {
            case 'weapons':
                this._spawnWeapon(entry.subId, count);
                break;
            case 'items':
                this._spawnConsumable(entry.subId, count);
                break;
            case 'vehicles':
                this._spawnVehicle(entry.subId, count);
                break;
            case 'enemies':
                this._spawnEnemy(entry, count);
                break;
            case 'objects':
                this._spawnObject(entry.subId, count);
                break;
            case 'costumes':
                this._applyCostume(entry);
                break;
        }
    }

    _spawnWeapon(configId, count) {
        // Find the inventory item id matching this weapon config
        let itemId = null;
        for (const [id, def] of this.inventorySystem.items) {
            if (def.type === 'weapon' && def.data && def.data.weaponConfigId === configId) {
                itemId = id;
                break;
            }
        }
        if (!itemId) {
            this._showMsg(`No item for weapon: ${configId}`);
            return;
        }

        let remaining = 0;
        for (let i = 0; i < count; i++) {
            remaining += this.inventorySystem.add(itemId, 1);
        }
        if (remaining > 0) {
            this._showMsg(`Added ${count - remaining}/${count} (inventory full)`);
        } else {
            this._showMsg(`Added ${count}x ${WEAPONS[configId]?.name || configId}`);
        }
    }

    _spawnConsumable(itemId, count) {
        const remaining = this.inventorySystem.add(itemId, count);
        const added = count - remaining;
        if (remaining > 0) {
            this._showMsg(`Added ${added}/${count} (inventory full)`);
        } else {
            this._showMsg(`Added ${count}x ${this.inventorySystem.getItemDef(itemId)?.name || itemId}`);
        }
    }

    _spawnVehicle(type, count) {
        for (let i = 0; i < count; i++) {
            const pos = this._getSpawnPosition(i, count);
            const vehicle = new Vehicle(pos.x, pos.y, type);
            this.worldSystem.vehicles.push(vehicle);
        }
        this._showMsg(`Spawned ${count}x ${type}`);
    }

    _spawnEnemy(entry, count) {
        const weaponId = entry.hasWeapon ? this._weaponSelect.value : undefined;
        let spawned = 0;
        for (let i = 0; i < count; i++) {
            const pos = this._getSpawnPosition(i, count);
            const enemy = this.worldSystem.spawnEnemy(entry.id, {
                x: pos.x,
                y: pos.y,
                weaponConfigId: weaponId
            });
            if (enemy) {
                if (enemy.isBoss) enemy.worldSystem = this.worldSystem;
                spawned++;
            }
        }
        this._showMsg(`Spawned ${spawned}/${count} ${entry.name}`);
    }

    _spawnObject(itemId, count) {
        const def = this.inventorySystem.getItemDef(itemId);
        if (!def || !def.data) {
            this._showMsg(`Unknown object: ${itemId}`);
            return;
        }
        const breakableType = def.data.breakableType || itemId.replace('placeable:', '');
        for (let i = 0; i < count; i++) {
            const pos = this._getSpawnPosition(i, count);
            const obj = new BreakableObject(pos.x, pos.y, breakableType);
            this.worldSystem.breakableObjects.push(obj);
        }
        this.worldSystem.markWorldStaticDirty();
        this._showMsg(`Spawned ${count}x ${def.name}`);
    }

    _getSpawnPosition(index, total) {
        const radius = 80;
        const angle = (index / Math.max(total, 1)) * Math.PI * 2;
        return {
            x: this.player.x + Math.cos(angle) * radius,
            y: this.player.y + Math.sin(angle) * radius
        };
    }

    // ---- Costume Tab ----

    _getCostumes() {
        const SLOT_LABELS = {
            hairstyle: '发型',
            hat: '帽子',
            clothes: '衣服',
            glasses: '眼镜',
            beard: '胡子',
        };
        const SLOT_ORDER = ['hairstyle', 'hat', 'clothes', 'glasses', 'beard'];
        const list = [];

        for (const slot of SLOT_ORDER) {
            const pieces = getCostumePiecesBySlot(slot);
            for (const [pieceId, piece] of Object.entries(pieces)) {
                list.push({
                    id: pieceId,
                    name: `[${SLOT_LABELS[slot]}] ${piece.name}`,
                    subId: pieceId,
                    icon: 'costume_' + pieceId,
                    slot: slot,
                });
            }
        }
        return list;
    }

    _applyCostume(entry) {
        if (!this.inventorySystem) {
            this._showMsg('InventorySystem not available');
            return;
        }

        const itemId = 'costume:' + entry.subId;
        const remaining = this.inventorySystem.add(itemId, 1);
        if (remaining > 0) {
            this._showMsg('Inventory full');
        } else {
            this._showMsg(`Added to backpack: ${entry.subId}`);
        }
    }

    _showMsg(text) {
        this._msgEl.textContent = text;
    }

    _clearMsg() {
        this._msgEl.textContent = '';
    }
}
