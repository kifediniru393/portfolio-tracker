const dbName = 'InvestmentTrackerDB';
const dbVersion = 1;

class InvestmentDB {
    constructor() {
        this.db = null;
        this.init().catch(error => {
            console.error('Failed to initialize database:', error);
        });
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create investments store
                if (!db.objectStoreNames.contains('investments')) {
                    const investmentStore = db.createObjectStore('investments', { keyPath: 'id', autoIncrement: true });
                    investmentStore.createIndex('date', 'date');
                    investmentStore.createIndex('maturity', 'maturity');
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
                }
            };
        });
    }

    async saveInvestment(investment) {
        const tx = this.db.transaction('investments', 'readwrite');
        const store = tx.objectStore('investments');

        return new Promise((resolve, reject) => {
            const request = store.add(investment);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllInvestments() {
        if (!this.db) {
            console.log('Database not initialized yet, waiting...');
            await this.init();
        }
        const tx = this.db.transaction('investments', 'readonly');
        const store = tx.objectStore('investments');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                console.log('Retrieved investments:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSettings(settings) {
        const tx = this.db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.put({ id: 'userSettings', ...settings });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSettings() {
        const tx = this.db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get('userSettings');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async resetDatabase() {
        // Close the current connection
        if (this.db) {
            this.db.close();
        }

        return new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase(dbName);

            req.onsuccess = () => {
                console.log('Database deleted successfully');
                // Reinitialize the database
                this.init().then(resolve).catch(reject);
            };

            req.onerror = () => {
                console.error('Could not delete database');
                reject(req.error);
            };
        });
    }

    async deleteInvestment(id) {
        const tx = this.db.transaction('investments', 'readwrite');
        const store = tx.objectStore('investments');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateInvestment(investment) {
        const tx = this.db.transaction('investments', 'readwrite');
        const store = tx.objectStore('investments');

        return new Promise((resolve, reject) => {
            const request = store.put(investment);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}