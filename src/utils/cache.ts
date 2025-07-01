import redis from "../configs/redis";
export const setCache = async <T>(key: string, data: T, ttlInSeconds = 600): Promise<void> => {
    try {
        const value = JSON.stringify(data);
        await redis.call('JSON.SET', key, '$', value);
    } catch (error: any) {
        console.log(`Faliled to set Chache for ${key}`, error);
    }
}

export const getCache = async <T>(key: string): Promise<T | null> => {
    try {
        const result = await redis.call('JSON.GET', key); // returns JSON string
       if (!result) return null;

        const data: T = JSON.parse(result as string); // cast to T
        return data;

    } catch (error: any) {
        console.log(`Failed to get cache for the key ${key}`, error);
        return null;
    }
};


export const  deleteCache = async (key : string) : Promise<void> =>{
    try {
        await redis.del(key)
    } catch (error : any) {
        console.log(`Error in deleting the cache for the key ${key}` , error);
}
}