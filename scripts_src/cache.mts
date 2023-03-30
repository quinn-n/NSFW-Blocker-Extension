export namespace Cache {
    class ArrayMap<K, V> extends Map<Array<K>, V> {
        get(key: Array<K>) {
            for (const pair of this.entries()) {
                const [k, v] = pair;
                const equals = key.every((val, index) => val === k[index]);
                if (equals) {
                    return v;
                }
            }
            return undefined;
        }
    }

    export class Cache<Key_T, Entry_T> {
        entries: Map<Key_T, Entry_T> = new Map();
        /*
        Adds an entry to the `Cache`'s entry list.
        If `timeToLive` is provided, delets the entry after `timeToLive` seconds.
        */
        createEntry(args: Key_T, result: Entry_T, timeToLive?: number) {
            this.entries.set(args, result);

            if (timeToLive != undefined) {
                this.setTimer(args, timeToLive);
            }
        }

        // Returns a cache entry for given args if one exists, else undefined
        getEntryOrNull(args: Key_T) {
            return this.entries.get(args);
        }

        // Manually remove an entry from the cache
        removeEntry(args: Key_T) {
            this.entries.delete(args);
        }

        // Creates a timeout to delete an entry
        private setTimer(args: Key_T, timeToLive: number) {
            setTimeout(
                () => this.removeEntry(args),
                timeToLive * 1000,
            );
        }
    }

    export class ArrayCache<Key_T, Entry_T> extends Cache<ReadonlyArray<Key_T>, Entry_T> {
        entries: ArrayMap<Key_T, Entry_T> = new ArrayMap<Key_T, Entry_T>();
    }

    export function asyncCache<Args_T, Return_T>(timeToLive?: number) {
        function inner(fcn: Function) {
            const cache = new ArrayCache<Args_T, Promise<Return_T>>();
            function wrapper(...args: ReadonlyArray<Args_T>) {
                // Check cache of existing results
                const cacheEntry = cache.getEntryOrNull(args);
                if (cacheEntry !== undefined) {
                    return cacheEntry;
                }
                // Call the function
                const p = new Promise<Return_T>((resolve, reject) => {
                    resolve(fcn(...args));
                });
                cache.createEntry(args, p, timeToLive);
                return p;
            }
            return wrapper;
        }
        return inner;
    }
};
