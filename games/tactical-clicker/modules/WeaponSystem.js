// 무기 시스템
class WeaponSystem {
    constructor() {
        this.weapons = {
            glock17: {
                name: 'Glock 17',
                damage: 35,
                rpm: 450,
                accuracy: 70,
                magSize: 17,
                reserveAmmo: 34,
                unlocked: true,
                price: 0,
                category: 'pistol'
            },
            m1911: {
                name: 'M1911',
                damage: 50,
                rpm: 400,
                accuracy: 75,
                magSize: 7,
                reserveAmmo: 21,
                unlocked: false,
                price: 5000,
                category: 'pistol'
            },
            mp5: {
                name: 'MP5',
                damage: 30,
                rpm: 800,
                accuracy: 75,
                magSize: 30,
                reserveAmmo: 90,
                unlocked: false,
                price: 15000,
                category: 'smg'
            },
            m4a1: {
                name: 'M4A1',
                damage: 45,
                rpm: 700,
                accuracy: 85,
                magSize: 30,
                reserveAmmo: 90,
                unlocked: false,
                price: 35000,
                category: 'ar'
            },
            ak74m: {
                name: 'AK-74M',
                damage: 55,
                rpm: 650,
                accuracy: 80,
                magSize: 30,
                reserveAmmo: 90,
                unlocked: false,
                price: 40000,
                category: 'ar'
            },
            svd: {
                name: 'SVD',
                damage: 85,
                rpm: 300,
                accuracy: 95,
                magSize: 10,
                reserveAmmo: 30,
                unlocked: false,
                price: 80000,
                category: 'sr'
            }
        };
        
        this.currentWeapon = 'glock17';
        this.currentAmmo = this.weapons[this.currentWeapon].magSize;
        this.reserveAmmo = this.weapons[this.currentWeapon].reserveAmmo;
    }
    
    unlockWeapon(weaponId) {
        const weapon = this.weapons[weaponId];
        if (weapon) {
            weapon.unlocked = true;
            return true;
        }
        return false;
    }
    
    equipWeapon(weaponId) {
        const weapon = this.weapons[weaponId];
        if (!weapon || !weapon.unlocked) return false;
        
        this.currentWeapon = weaponId;
        this.currentAmmo = weapon.magSize;
        this.reserveAmmo = weapon.reserveAmmo;
        return true;
    }
    
    shoot() {
        if (this.currentAmmo <= 0) return false;
        
        this.currentAmmo--;
        return true;
    }
    
    reload() {
        const weapon = this.getCurrentWeapon();
        
        if (this.currentAmmo === weapon.magSize || this.reserveAmmo === 0) {
            return false;
        }
        
        const needed = weapon.magSize - this.currentAmmo;
        const reloadAmount = Math.min(needed, this.reserveAmmo);
        
        this.currentAmmo += reloadAmount;
        this.reserveAmmo -= reloadAmount;
        return true;
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    getWeapon(weaponId) {
        return this.weapons[weaponId];
    }
    
    getAllWeapons() {
        return this.weapons;
    }
}
