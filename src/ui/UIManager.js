import { Assets } from '../graphics/Assets.js';
import { SLOT_COUNT, HOTBAR_SIZE } from '../core/systems/InventorySystem.js';
import { generateAvatar } from '../assets/characters/player/AvatarSprite.js';

// UIManager.js
// Manages the DOM-based UI updates

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.hpBar = document.getElementById('hp-fill');
        this.hpText = document.getElementById('hp-text');
        this.staminaBar = document.getElementById('stamina-fill');
        this.staminaText = document.getElementById('stamina-text');
        
        this.weaponIcon = document.getElementById('weapon-icon-img');
        this.weaponName = document.getElementById('weapon-name');
        this.ammoText = document.getElementById('ammo-text');
        
        this.messageContainer = document.getElementById('message-log');
        
        // Cache for weapon data URLs
        this.weaponIconCache = new Map();
        this.hotbarIconCache = new Map();
        // Current weapon key to avoid redundant updates
        this.currentWeaponKey = null;

        this.hotbarContainer = document.getElementById('hotbar-panel');
        this.initHotbarSlots();

        // Initialize Avatar
        this.initAvatar();

        // Create Game Over Screen
        this.createGameOverScreen();

        // Cursor Item
        this.cursorItem = null;
        this.createCursorItemDOM();

        // Inventory UI
        this.initInventoryUI();

        // Costume System references
        this.costumeSystem = null;
        this.player = null;

        // Callbacks
        this.onInventorySlotClick = null; // (index, isRightClick, isShift)
        this.onDropItem = null; // (itemData) -> void
        this.onHotbarSlotClick = null; // (index) -> void
        this.onCloseInventory = null; // () -> void
        this.onCostumeChanged = null; // () -> void
    }

    /**
     * Set costume system and player references for costume UI
     */
    setCostumeRefs(costumeSystem, player) {
        this.costumeSystem = costumeSystem;
        this.player = player;
    }

    createCursorItemDOM() {
        this.cursorItemEl = document.createElement('div');
        this.cursorItemEl.id = 'cursor-item';
        document.body.appendChild(this.cursorItemEl);

        document.addEventListener('mousemove', (e) => {
            if (this.cursorItemEl.style.display !== 'none') {
                this.cursorItemEl.style.left = `${e.clientX + 10}px`;
                this.cursorItemEl.style.top = `${e.clientY + 10}px`;
            }
            if (this.tooltip.style.display !== 'none') {
                this.tooltip.style.left = `${e.clientX + 15}px`;
                this.tooltip.style.top = `${e.clientY + 15}px`;
            }
        });
    }

    initInventoryUI() {
        this.inventoryOverlay = document.createElement('div');
        this.inventoryOverlay.id = 'inventory-overlay';
        this.inventoryOverlay.className = 'hidden'; // Default hidden

        const windowEl = document.createElement('div');
        windowEl.className = 'inventory-window';

        // Two-column layout: costume panel | inventory content
        const bodyRow = document.createElement('div');
        bodyRow.className = 'inventory-body-row';

        // -- Costume Panel (Left) --
        this.costumePanel = this._createCostumePanel();
        bodyRow.appendChild(this.costumePanel);

        // -- Character Preview (Center) --
        this.characterPreview = this._createCharacterPreview();
        bodyRow.appendChild(this.characterPreview);

        // -- Inventory Content (Right) --
        const inventoryContent = document.createElement('div');
        inventoryContent.className = 'inventory-content';

        const header = document.createElement('div');
        header.className = 'inventory-header';
        header.innerText = 'INVENTORY';
        inventoryContent.appendChild(header);

        // Backpack Grid
        const backpackGrid = document.createElement('div');
        backpackGrid.className = 'inventory-grid backpack-grid';
        for (let i = HOTBAR_SIZE; i < SLOT_COUNT; i++) {
            const slot = this.createInventorySlotElement(i);
            backpackGrid.appendChild(slot);
        }
        inventoryContent.appendChild(backpackGrid);

        // Divider
        const divider = document.createElement('div');
        divider.className = 'inventory-divider';
        inventoryContent.appendChild(divider);

        // Hotbar Grid (Mirror)
        const hotbarGrid = document.createElement('div');
        hotbarGrid.className = 'inventory-grid hotbar-grid';
        for (let i = 0; i < HOTBAR_SIZE; i++) {
            const slot = this.createInventorySlotElement(i);
            hotbarGrid.appendChild(slot);
        }
        inventoryContent.appendChild(hotbarGrid);

        bodyRow.appendChild(inventoryContent);
        windowEl.appendChild(bodyRow);

        this.inventoryOverlay.appendChild(windowEl);

        // Tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'item-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);

        document.body.appendChild(this.inventoryOverlay);

        // Handle Drop (Click outside window)
        this.inventoryOverlay.addEventListener('mousedown', (e) => {
            if (e.target === this.inventoryOverlay) {
                if (this.cursorItem) {
                    if (this.onDropItem) {
                        this.onDropItem(this.cursorItem);
                        this.cursorItem = null;
                        this.updateInventoryUIState();
                    }
                } else if (this.onCloseInventory) {
                    this.onCloseInventory();
                }
            }
        });
    }

    _createCostumePanel() {
        const COSTUME_SLOTS = [
            { slot: 'hat', label: '帽子' },
            { slot: 'hairstyle', label: '发型' },
            { slot: 'glasses', label: '眼镜' },
            { slot: 'beard', label: '胡子' },
            { slot: 'clothes', label: '衣服' },
        ];

        const panel = document.createElement('div');
        panel.className = 'costume-panel';

        const title = document.createElement('div');
        title.className = 'costume-panel-title';
        title.innerText = 'COSTUME';
        panel.appendChild(title);

        this.costumeSlotElements = {};

        COSTUME_SLOTS.forEach(({ slot, label }) => {
            const container = document.createElement('div');
            container.className = 'costume-slot-container';

            const slotEl = document.createElement('div');
            slotEl.className = 'inventory-slot costume-slot';
            slotEl.dataset.costumeSlot = slot;

            const icon = document.createElement('img');
            icon.style.display = 'none';
            slotEl.appendChild(icon);

            slotEl.onmousedown = (e) => {
                e.preventDefault();
                this._handleCostumeSlotClick(slot);
            };
            slotEl.oncontextmenu = (e) => e.preventDefault();

            // Tooltip for costume slot
            slotEl.onmouseenter = () => this._showCostumeTooltip(slot);
            slotEl.onmouseleave = () => this.hideTooltip();

            container.appendChild(slotEl);

            const labelEl = document.createElement('div');
            labelEl.className = 'costume-slot-label';
            labelEl.innerText = label;
            container.appendChild(labelEl);

            panel.appendChild(container);
            this.costumeSlotElements[slot] = slotEl;
        });

        return panel;
    }

    _handleCostumeSlotClick(slot) {
        if (!this.costumeSystem || !this.player || !this.lastInventorySystem) return;

        if (this.cursorItem) {
            // Has cursorItem → try to equip into this slot
            const def = this.cursorItem.def;
            if (!def || def.type !== 'costume' || def.data?.costumeSlot !== slot) return; // Type mismatch

            const newPieceId = def.data.costumePieceId;
            const oldPieceId = this.player.costume[slot];

            // Equip new piece
            this.costumeSystem.equipCostume(this.player, slot, newPieceId);
            this.cursorItem = null;

            // Old piece goes to cursorItem (swap)
            if (oldPieceId) {
                const oldItemId = 'costume:' + oldPieceId;
                this.cursorItem = {
                    itemId: oldItemId,
                    count: 1,
                    instanceData: null,
                    def: this.lastInventorySystem.getItemDef(oldItemId)
                };
            }
        } else {
            // No cursorItem → pick up from slot (unequip)
            const currentPieceId = this.player.costume[slot];
            if (!currentPieceId) return; // Empty slot

            this.costumeSystem.unequipCostume(this.player, slot);
            const itemId = 'costume:' + currentPieceId;
            this.cursorItem = {
                itemId: itemId,
                count: 1,
                instanceData: null,
                def: this.lastInventorySystem.getItemDef(itemId)
            };
        }

        this._onCostumeChanged();
        this.updateInventory(this.lastInventorySystem);
        this.updateHotbar(this.lastInventorySystem);
        this.updateCostumeSlots();
        this.updateInventoryUIState();
    }

    /**
     * Equip a costume item directly from inventory (right-click)
     */
    _equipCostumeFromInventory(index, inventorySystem) {
        const slot = inventorySystem.slots[index];
        if (!slot.itemId) return false;

        const def = inventorySystem.getItemDef(slot.itemId);
        if (!def || def.type !== 'costume' || !this.costumeSystem || !this.player) return false;

        const costumeSlot = def.data.costumeSlot;
        const newPieceId = def.data.costumePieceId;
        const oldPieceId = this.player.costume[costumeSlot];

        // Remove from inventory slot
        slot.itemId = null;
        slot.count = 0;
        slot.instanceData = null;

        // Equip new piece
        this.costumeSystem.equipCostume(this.player, costumeSlot, newPieceId);

        // Return old piece to inventory
        if (oldPieceId) {
            inventorySystem.add('costume:' + oldPieceId, 1);
        }

        this._onCostumeChanged();
        this.updateInventory(inventorySystem);
        this.updateHotbar(inventorySystem);
        this.updateCostumeSlots();
        return true;
    }

    _showCostumeTooltip(slot) {
        if (!this.player) return;
        const pieceId = this.player.costume[slot];
        const slotNames = { hat: '帽子', hairstyle: '发型', glasses: '眼镜', beard: '胡子', clothes: '衣服' };
        const slotName = slotNames[slot] || slot;

        let pieceName = '无';
        if (pieceId && this.lastInventorySystem) {
            const def = this.lastInventorySystem.getItemDef('costume:' + pieceId);
            if (def) pieceName = def.name;
        }

        this.tooltip.innerHTML = `
            <div class="tooltip-title">${slotName}</div>
            <div class="tooltip-desc">${pieceName}</div>
            <div class="tooltip-hint">${pieceId ? '点击拾取' : '拖拽装备到此处'}</div>
        `;
        this.tooltip.style.display = 'block';
    }

    _createCharacterPreview() {
        const container = document.createElement('div');
        container.className = 'character-preview';

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        container.appendChild(canvas);

        this.previewCanvas = canvas;
        this.previewCtx = canvas.getContext('2d');
        this.previewFrames = null;
        this.previewFrameIndex = 0;
        this.previewAnimId = null;
        this.previewLastFrameTime = 0;

        return container;
    }

    _updateCharacterPreview() {
        if (!this.costumeSystem || !this.player) return;
        this.previewFrames = this.costumeSystem.getPlayerFrames(this.player.costume).idle;
        this.previewFrameIndex = 0;
        this._drawPreviewFrame();
    }

    _drawPreviewFrame() {
        if (!this.previewFrames || !this.previewCtx) return;
        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, 128, 128);
        ctx.imageSmoothingEnabled = false;
        const frame = this.previewFrames[this.previewFrameIndex % this.previewFrames.length];
        if (frame) {
            // Draw 32x32 sprite scaled 4x to 128x128
            ctx.drawImage(frame, 0, 0, 128, 128);
        }
    }

    _startPreviewAnimation() {
        this._updateCharacterPreview();
        this.previewLastFrameTime = performance.now();
        const animate = (now) => {
            if (now - this.previewLastFrameTime >= 100) {
                this.previewFrameIndex++;
                this._drawPreviewFrame();
                this.previewLastFrameTime = now;
            }
            this.previewAnimId = requestAnimationFrame(animate);
        };
        this.previewAnimId = requestAnimationFrame(animate);
    }

    _stopPreviewAnimation() {
        if (this.previewAnimId) {
            cancelAnimationFrame(this.previewAnimId);
            this.previewAnimId = null;
        }
    }

    _onCostumeChanged() {
        // Update avatar portrait
        if (this.player) {
            this._updateAvatar();
        }
        // Update character preview
        this._updateCharacterPreview();
        if (this.onCostumeChanged) this.onCostumeChanged();
    }

    _updateAvatar() {
        const avatarContainer = document.querySelector('.avatar-frame');
        if (!avatarContainer) return;
        const img = avatarContainer.querySelector('img');
        if (!img) return;
        const avatarCanvas = generateAvatar(this.player.costume);
        img.src = avatarCanvas.toDataURL();
    }

    updateCostumeSlots() {
        if (!this.costumeSlotElements || !this.player) return;

        const iconMap = {
            'hair_long': 'costume_hair_long',
            'hair_messy': 'costume_hair_messy',
            'hair_short': 'costume_hair_short',
            'hat_beret': 'costume_hat_beret',
            'hat_bandana': 'costume_hat_bandana',
            'clothes_coat': 'costume_clothes_coat',
            'clothes_hoodie': 'costume_clothes_hoodie',
            'clothes_vest': 'costume_clothes_vest',
            'glasses_sun': 'costume_glasses_sun',
            'glasses_round': 'costume_glasses_round',
            'glasses_goggles': 'costume_glasses_goggles',
            'beard_full': 'costume_beard_full',
            'hat_santa': 'costume_hat_santa',
            'clothes_santa': 'costume_clothes_santa',
            'beard_santa': 'costume_beard_santa',
            'hat_clown': 'costume_hat_clown',
            'clothes_clown': 'costume_clothes_clown',
            'hair_clown': 'costume_hair_clown',
        };

        for (const [slot, el] of Object.entries(this.costumeSlotElements)) {
            const pieceId = this.player.costume[slot];
            const iconEl = el.querySelector('img');

            if (pieceId && iconMap[pieceId]) {
                this.updateHotbarIcon(iconEl, iconMap[pieceId]);
            } else {
                iconEl.style.display = 'none';
            }
        }
    }

    createInventorySlotElement(index) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.index = index;
        
        const icon = document.createElement('img');
        icon.style.display = 'none';
        slot.appendChild(icon);
        
        const count = document.createElement('span');
        count.className = 'hotbar-count';
        slot.appendChild(count);
        
        // Mouse Events for Interaction
        slot.onmousedown = (e) => {
            // Prevent default selection
            e.preventDefault();
            
            if (this.onInventorySlotClick) {
                const isRight = e.button === 2;
                const isShift = e.shiftKey;
                this.onInventorySlotClick(index, isRight, isShift);
            }
        };
        
        // Prevent Context Menu
        slot.oncontextmenu = (e) => e.preventDefault();
        
        // Tooltip Events
        slot.onmouseenter = () => this.showTooltip(index);
        slot.onmouseleave = () => this.hideTooltip();
        
        return slot;
    }
    
    showTooltip(index) {
        // Need access to InventorySystem here. 
        // We can store a reference or pass it. 
        // Current design passes it to update functions.
        // We'll store the last used InventorySystem reference in updateInventory?
        // Or better, UIManager shouldn't know logic.
        // But for Tooltip text, we need itemDef.
        
        if (!this.lastInventorySystem) return;
        
        const slot = this.lastInventorySystem.slots[index];
        if (!slot || !slot.itemId) return;
        
        const def = this.lastInventorySystem.getItemDef(slot.itemId);
        if (!def) return;
        
        const hint = def.type === 'costume'
            ? '拖拽到槽位装备'
            : 'L-Click: Move | R-Click: Split';
        this.tooltip.innerHTML = `
            <div class="tooltip-title">${def.name}</div>
            <div class="tooltip-type">${def.type.toUpperCase()}</div>
            ${def.description ? `<div class="tooltip-desc">${def.description}</div>` : ''}
            <div class="tooltip-hint">${hint}</div>
        `;
        
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    toggleInventory(visible) {
        if (visible) {
            this.inventoryOverlay.classList.remove('hidden');
            this._startPreviewAnimation();
        } else {
            this.inventoryOverlay.classList.add('hidden');
            this._stopPreviewAnimation();
            // If we have cursor item when closing, try to return it?
            // For now, just keep it in "cursor" state hidden,
            // or we could force drop.
            // Ideally, we should cancel the cursor item.
            if (this.cursorItem && this.onInventorySlotClick) {
                // We don't have an easy way to "return to source".
                // Just hide the cursor visual.
                this.cursorItemEl.style.display = 'none';
            }
        }
    }

    handleInventoryClick(index, inventorySystem, isRight = false, isShift = false) {
        const slot = inventorySystem.slots[index];

        // (Costume items are equipped via drag-and-drop to costume slots)

        if (isShift) {
            // Quick Transfer Logic
            // If in Hotbar -> Move to Backpack
            // If in Backpack -> Move to Hotbar
            if (!slot.itemId) return;
            
            const isHotbar = index < HOTBAR_SIZE;
            let targetStart = isHotbar ? HOTBAR_SIZE : 0;
            let targetEnd = isHotbar ? SLOT_COUNT : HOTBAR_SIZE;
            
            // Try to merge first
            for (let i = targetStart; i < targetEnd; i++) {
                if (inventorySystem.moveOrSwap(index, i)) {
                    // Check if fully moved? moveOrSwap doesn't return partial info easily but handles merge.
                    // If slot is empty, we are done.
                    if (!slot.itemId) break;
                }
            }
            // If still has items, try empty slots
            if (slot.itemId) {
                for (let i = targetStart; i < targetEnd; i++) {
                    if (!inventorySystem.slots[i].itemId) {
                        inventorySystem.moveOrSwap(index, i);
                        if (!slot.itemId) break;
                    }
                }
            }
            
            this.updateInventory(inventorySystem);
            this.updateHotbar(inventorySystem);
            return;
        }

        if (!this.cursorItem) {
            // === Pick up ===
            if (slot.itemId) {
                if (isRight) {
                    // Split / Take Half
                    const total = slot.count;
                    const take = Math.ceil(total / 2);
                    
                    this.cursorItem = {
                        itemId: slot.itemId,
                        count: take,
                        instanceData: slot.instanceData,
                        def: inventorySystem.getItemDef(slot.itemId)
                    };
                    
                    slot.count -= take;
                    if (slot.count <= 0) {
                        slot.itemId = null;
                        slot.count = 0;
                        slot.instanceData = null;
                    }
                } else {
                    // Take All
                    this.cursorItem = {
                        itemId: slot.itemId,
                        count: slot.count,
                        instanceData: slot.instanceData,
                        def: inventorySystem.getItemDef(slot.itemId)
                    };
                    // Clear slot
                    slot.itemId = null;
                    slot.count = 0;
                    slot.instanceData = null;
                }
            }
        } else {
            // === Place / Swap ===
            if (isRight) {
                // Place One
                if (!slot.itemId) {
                    // Place 1 into empty
                    slot.itemId = this.cursorItem.itemId;
                    slot.count = 1;
                    slot.instanceData = this.cursorItem.instanceData;
                    
                    this.cursorItem.count--;
                } else if (slot.itemId === this.cursorItem.itemId) {
                    // Stack 1
                    const def = this.cursorItem.def;
                    if (slot.count < def.maxStack) {
                        slot.count++;
                        this.cursorItem.count--;
                    }
                } else {
                    // Different item: Swap? 
                    // Right click usually doesn't swap, it places.
                    // If different, do nothing or swap? 
                    // Standard: Swap is Left Click. Right click usually does nothing on different item.
                    // Let's swap for convenience or ignore.
                    // Let's swap.
                    const temp = { ...slot };
                    slot.itemId = this.cursorItem.itemId;
                    slot.count = this.cursorItem.count;
                    slot.instanceData = this.cursorItem.instanceData;
                    
                    this.cursorItem = {
                        itemId: temp.itemId,
                        count: temp.count,
                        instanceData: temp.instanceData,
                        def: inventorySystem.getItemDef(temp.itemId)
                    };
                }
                
                if (this.cursorItem.count <= 0) {
                    this.cursorItem = null;
                }
            } else {
                // Left Click: Place All / Swap
                if (!slot.itemId) {
                    // Place into empty
                    slot.itemId = this.cursorItem.itemId;
                    slot.count = this.cursorItem.count;
                    slot.instanceData = this.cursorItem.instanceData;
                    this.cursorItem = null;
                } else if (slot.itemId === this.cursorItem.itemId) {
                    // Stack
                    const def = this.cursorItem.def;
                    if (def.maxStack > 1) {
                        const space = def.maxStack - slot.count;
                        const toAdd = Math.min(space, this.cursorItem.count);
                        
                        slot.count += toAdd;
                        this.cursorItem.count -= toAdd;
                        
                        if (this.cursorItem.count <= 0) {
                            this.cursorItem = null;
                        }
                    } else {
                        // Swap (if not stackable)
                        const temp = { ...slot };
                        slot.itemId = this.cursorItem.itemId;
                        slot.count = this.cursorItem.count;
                        slot.instanceData = this.cursorItem.instanceData;
                        
                        this.cursorItem = {
                            itemId: temp.itemId,
                            count: temp.count,
                            instanceData: temp.instanceData,
                            def: inventorySystem.getItemDef(temp.itemId)
                        };
                    }
                } else {
                    // Swap different items
                    const temp = { ...slot };
                    
                    slot.itemId = this.cursorItem.itemId;
                    slot.count = this.cursorItem.count;
                    slot.instanceData = this.cursorItem.instanceData;
                    
                    this.cursorItem = {
                        itemId: temp.itemId,
                        count: temp.count,
                        instanceData: temp.instanceData,
                        def: inventorySystem.getItemDef(temp.itemId)
                    };
                }
            }
        }
        
        this.updateInventory(inventorySystem);
        this.updateHotbar(inventorySystem); // Sync main HUD
    }

    updateInventory(inventorySystem) {
        this.lastInventorySystem = inventorySystem; // Cache for tooltip
        
        if (this.inventoryOverlay.classList.contains('hidden')) return;

        const slots = this.inventoryOverlay.querySelectorAll('.inventory-slot:not(.costume-slot)');
        slots.forEach(slotEl => {
            const index = parseInt(slotEl.dataset.index);
            const itemSlot = inventorySystem.slots[index];
            
            const iconEl = slotEl.querySelector('img');
            const countEl = slotEl.querySelector('.hotbar-count');
            
            if (itemSlot && itemSlot.itemId) {
                const def = inventorySystem.getItemDef(itemSlot.itemId);
                if (def) {
                    this.updateHotbarIcon(iconEl, def.icon);
                }
                countEl.innerText = itemSlot.count > 1 ? itemSlot.count : '';
            } else {
                iconEl.style.display = 'none';
                countEl.innerText = '';
            }
            
            // Highlight selected hotbar slot in inventory too?
            if (index < HOTBAR_SIZE) {
                if (index === inventorySystem.getSelectedSlotIndex()) {
                    slotEl.classList.add('selected');
                } else {
                    slotEl.classList.remove('selected');
                }
            }
        });

        this.updateCostumeSlots();
        this.updateInventoryUIState();
    }

    // Separate method to update cursor only (called by Drop)
    updateInventoryUIState() {
        // Update Cursor Item Visual
        if (this.cursorItem) {
            this.cursorItemEl.innerHTML = '';
            const def = this.cursorItem.def;
            
            // Icon
            const iconKey = def.icon;
            const img = document.createElement('img');
            // Reuse cache logic? 
            // We can just call updateHotbarIcon on this img if we want.
            this.updateHotbarIcon(img, iconKey);
            this.cursorItemEl.appendChild(img);
            
            // Count
            if (this.cursorItem.count > 1) {
                const span = document.createElement('span');
                span.className = 'hotbar-count';
                span.innerText = this.cursorItem.count;
                this.cursorItemEl.appendChild(span);
            }
            
            this.cursorItemEl.style.display = 'block';
        } else {
            this.cursorItemEl.style.display = 'none';
        }
    }

    createGameOverScreen() {
        this.gameOverOverlay = document.createElement('div');
        this.gameOverOverlay.id = 'game-over-overlay';
        this.gameOverOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #c0392b;
            font-family: 'Courier New', monospace;
        `;

        const title = document.createElement('h1');
        title.innerText = "YOU DIED";
        title.style.fontSize = "4rem";
        title.style.marginBottom = "2rem";
        title.style.textShadow = "0 0 10px #e74c3c";

        const restartBtn = document.createElement('button');
        restartBtn.innerText = "TRY AGAIN";
        restartBtn.style.cssText = `
            padding: 15px 30px;
            font-size: 1.5rem;
            background: #2c3e50;
            color: white;
            border: 2px solid #7f8c8d;
            cursor: pointer;
            font-family: inherit;
        `;
        restartBtn.onmouseover = () => restartBtn.style.background = '#e74c3c';
        restartBtn.onmouseout = () => restartBtn.style.background = '#2c3e50';
        restartBtn.onclick = () => window.location.reload();

        this.gameOverOverlay.appendChild(title);
        this.gameOverOverlay.appendChild(restartBtn);
        document.body.appendChild(this.gameOverOverlay);
    }

    showGameOver() {
        this.gameOverOverlay.style.display = 'flex';
    }

    initAvatar() {
        const avatarContainer = document.querySelector('.avatar-frame');
        // Clear placeholder
        avatarContainer.innerHTML = '';
        
        const img = document.createElement('img');
        // Use the dedicated Avatar Asset
        if (Assets.avatar) {
            img.src = Assets.avatar.toDataURL();
            // Scale up for pixel art look in CSS
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            // Disable anti-aliasing for the image itself if needed
            img.style.imageRendering = 'pixelated'; 
        }
        avatarContainer.appendChild(img);
    }

    /**
     * 更新玩家状态 (HP, Stamina)
     * @param {Object} player 
     */
    updatePlayerStatus(player) {
        // HP
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        this.hpBar.style.width = `${hpPercent}%`;
        this.hpText.innerText = `${Math.ceil(player.hp)}/${player.maxHp}`;

        // Stamina / Roll Cooldown
        const maxCd = 60;
        let staminaPercent = 100;
        let staminaLabel = "READY";
        if (player.rollCooldown > 0) {
            staminaPercent = 100 - (player.rollCooldown / maxCd * 100);
            staminaLabel = "RECHARGING";
        }
        this.staminaBar.style.width = `${Math.max(0, staminaPercent)}%`;
        this.staminaText.innerText = staminaLabel;
    }

    /**
     * 更新武器信息
     * @param {Object} weapon Current weapon config
     * @param {Object} weaponState Current weapon ammo state
     */
    updateWeapon(weapon, weaponState) {
        if (!weapon) return;
        
        this.weaponName.innerText = weapon.name;

        if (weapon.isMelee) {
            this.ammoText.innerText = "MELEE";
        } else if (weaponState) {
            this.ammoText.innerText = `${weaponState.currentAmmo} / ${weaponState.reserveAmmo}`;
        } else {
            this.ammoText.innerText = "- / -";
        }
        
        // Update Icon (if we had specific icon assets, we'd use them)
        // For now, maybe clear it or use a placeholder based on type
        // This requires we export weapon sprites as DataURL or separate images
        // Since our assets are on Canvas, this is tricky. 
        // We can create a temporary canvas to render the weapon sprite to an image URL.
        // For efficiency, we should do this only when weapon changes.
        this.renderWeaponIcon(weapon);
    }

    renderWeaponIcon(weapon) {
        if (!weapon || !weapon.sprite) return;
        
        // If same weapon, skip
        if (this.currentWeaponKey === weapon.sprite) return;
        this.currentWeaponKey = weapon.sprite;

        // Check cache
        if (this.weaponIconCache.has(weapon.sprite)) {
            this.weaponIcon.src = this.weaponIconCache.get(weapon.sprite);
            this.weaponIcon.style.display = 'block';
            this.adjustWeaponIconStyle();
            return;
        }

        // Generate DataURL from Asset Canvas
        const spriteCanvas = Assets[weapon.sprite];
        if (spriteCanvas) {
            // Convert to DataURL
            const dataURL = spriteCanvas.toDataURL();
            this.weaponIconCache.set(weapon.sprite, dataURL);
            this.weaponIcon.src = dataURL;
            this.weaponIcon.style.display = 'block';
            this.adjustWeaponIconStyle();
        }
    }

    adjustWeaponIconStyle() {
        // Ensure the icon scales nicely
        this.weaponIcon.style.width = '80%';
        this.weaponIcon.style.height = '80%';
        this.weaponIcon.style.objectFit = 'contain';
        this.weaponIcon.style.imageRendering = 'pixelated';
        
        // Remove the text placeholder if it exists (by hiding sibling spans)
        // The HTML structure is <div class="weapon-icon"><img ...><span ...></div>
        // We can just hide all spans inside weapon-icon parent
        const parent = this.weaponIcon.parentElement;
        const spans = parent.querySelectorAll('span');
        spans.forEach(s => s.style.display = 'none');
    }

    initHotbarSlots() {
        if (!this.hotbarContainer) return;
        this.hotbarContainer.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.dataset.index = i;
            
            const key = document.createElement('span');
            key.className = 'hotbar-key';
            key.innerText = i + 1;
            
            const icon = document.createElement('img');
            icon.className = 'hotbar-icon';
            icon.style.display = 'none';
            
            const count = document.createElement('span');
            count.className = 'hotbar-count';
            
            slot.appendChild(key);
            slot.appendChild(icon);
            slot.appendChild(count);
            
            // Add Click Event for Selection
            slot.onmousedown = (e) => {
                e.preventDefault(); // Prevent focus issues
                if (this.onHotbarSlotClick) {
                    this.onHotbarSlotClick(i);
                }
            };
            
            this.hotbarContainer.appendChild(slot);
        }
    }

    updateHotbar(inventorySystem) {
        if (!this.hotbarContainer) return;
        
        const slots = this.hotbarContainer.children;
        const selectedIndex = inventorySystem.getSelectedSlotIndex();
        
        for (let i = 0; i < 9; i++) {
            const slotEl = slots[i];
            const itemSlot = inventorySystem.slots[i]; // Direct access
            
            // Selected state
            if (i === selectedIndex) {
                slotEl.classList.add('selected');
            } else {
                slotEl.classList.remove('selected');
            }
            
            const iconEl = slotEl.querySelector('.hotbar-icon');
            const countEl = slotEl.querySelector('.hotbar-count');
            
            if (itemSlot && itemSlot.itemId) {
                const def = inventorySystem.getItemDef(itemSlot.itemId);
                
                // Icon
                if (def) {
                    this.updateHotbarIcon(iconEl, def.icon);
                }
                
                // Count
                if (itemSlot.count > 1) {
                    countEl.innerText = itemSlot.count;
                } else {
                    countEl.innerText = '';
                }
            } else {
                iconEl.style.display = 'none';
                countEl.innerText = '';
            }
        }
    }
    
    updateHotbarIcon(imgEl, iconKey) {
        if (this.hotbarIconCache.has(iconKey)) {
            const src = this.hotbarIconCache.get(iconKey);
            if (imgEl.src !== src) imgEl.src = src;
            imgEl.style.display = 'block';
            return;
        }
        
        // Find sprite
        let sprite = null;
        if (Assets.objects && Assets.objects[iconKey]) {
            sprite = Assets.objects[iconKey];
        } else if (Assets[iconKey]) {
            sprite = Assets[iconKey];
        }
        
        if (Array.isArray(sprite)) sprite = sprite[0];
        
        if (sprite && sprite.toDataURL) {
            const dataURL = sprite.toDataURL();
            this.hotbarIconCache.set(iconKey, dataURL);
            imgEl.src = dataURL;
            imgEl.style.display = 'block';
        } else {
            // Fallback or not found
            imgEl.style.display = 'none';
        }
    }

    /**
     * 添加日志消息
     * @param {string} msg 
     */
    log(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = msg;
        this.messageContainer.appendChild(entry);
        
        // Remove after animation
        setTimeout(() => {
            entry.remove();
        }, 3000);
    }
}
